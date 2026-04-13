const Review = require('../models/Review');
const Company = require('../models/Company');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const recalcCompanyStats = require('../utils/recalcCompanyStats');

// @desc    Get all reviews for a company
// @route   GET /api/reviews/:companyId
// @access  Private (Subscribed only)
const getReviews = asyncHandler(async (req, res) => {
  const { companyId } = req.params;

  // STRICT: Subscription Check
  if (!req.user || !req.user.isSubscribed) {
    res.status(403);
    throw new Error('Subscription required to view reviews');
  }

  // STRICT: Fetch from MongoDB, Sort DESC
  const reviews = await Review.find({ companyId: companyId })
    .populate('userId', 'name companyName role isSubscribed ownedCompanyId profilePhoto') // Populate user details
    .sort({ createdAt: -1 })
    .lean();

  // Sanitize public data for anonymous reviews
  reviews.forEach(r => {
    if (r.isAnonymous && r.userId) {
      r.userId.name = 'Anonymous User';
      r.userId.companyName = undefined;
      r.userId.ownedCompanyId = undefined;
      r.userId.profilePhoto = undefined;
    }
  });

  res.status(200).json(reviews);
});

// @desc    Add a review
// @route   POST /api/reviews
// @access  Private (Subscribed only)
const addReview = asyncHandler(async (req, res) => {
  const { companyId, rating, comment, wouldDealAgain, isAnonymous } = req.body;

  // 1. Authenticate & Subscribe Check
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized');
  }

  // Review limit is now enforced by checkReviewLimit middleware
  // No subscription gate here — free users get 5 reviews

  const company = await Company.findById(companyId);
  if (!company) {
    res.status(404);
    throw new Error('Company not found');
  }

  // 4. Ownership Check
  if (company.submittedBy && company.submittedBy.toString() === req.user.id.toString()) {
    res.status(403);
    throw new Error('You cannot review your own company');
  }

  // Check for existing review
  const reviewExists = await Review.findOne({
    userId: req.user.id,
    companyId: companyId
  });

  if (reviewExists) {
    res.status(400);
    throw new Error('You have already reviewed this company');
  }

  // 5. Create Review
  try {
      const review = await Review.create({
        companyId,
        userId: req.user.id,
        rating: Number(rating),
        wouldDealAgain: Boolean(wouldDealAgain),
        comment,
        isAnonymous: Boolean(isAnonymous)
      });

      // Recalculate company stats
      await recalcCompanyStats(companyId);

      // 6. Increment reviewCount on User
      await User.findByIdAndUpdate(req.user.id, { $inc: { reviewCount: 1 } });

      // Log Activity (Reviewer)
      await require('./activityController').logActivity(req.user.id, 'REVIEW', `You reviewed ${company.name}`);

      // Log Activity (Company Owner)
      if (company.submittedBy) {
        await require('./activityController').logActivity(company.submittedBy, 'REVIEW', `Your company ${company.name} received a new review.`);
      }

      // 8. Trigger Recalculation
      await recalculateReputation(companyId);

      // 9. Return Created Review
      res.status(201).json(review);
  } catch (err) {
      console.error('[FATAL] DB Write Failed:', err);
      res.status(500);
      throw new Error('Database write failed: ' + err.message);
  }
});

// @desc    Recalculate Company Reputation
// @access  Internal
const recalculateReputation = async (companyId) => {
  console.log(`[PERSISTENCE] Recalculating reputation for Company: ${companyId}`);

  // 1. Fetch all reviews
  const stats = await Review.aggregate([
    {
      $match: { companyId: new mongoose.Types.ObjectId(companyId) }
    },
    {
      $group: {
        _id: '$companyId',
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        dealAgainCount: {
          $sum: { $cond: [{ $eq: ['$wouldDealAgain', true] }, 1, 0] }
        }
      }
    }
  ]);

  let updateData = {};

  if (stats.length > 0) {
    const { avgRating, totalReviews, dealAgainCount } = stats[0];
    const dealAgainPercentage = (dealAgainCount / totalReviews) * 100;
    const roundedRating = Number(avgRating.toFixed(1));
    const roundedDealAgain = Math.round(dealAgainPercentage);

    // Determine Trust Status
    let trustStatus = 'UNRATED';

    if (roundedRating >= 4.0 && roundedDealAgain >= 70) {
      trustStatus = 'TRUSTED';
    } else if (roundedRating < 2.5 || roundedDealAgain < 40) {
      trustStatus = 'LOW_TRUST';
    } else {
      trustStatus = 'CAUTION';
    }

    updateData = {
      avgRating: roundedRating,
      totalReviews: totalReviews,
      dealAgainPercentage: roundedDealAgain,
      trustStatus: trustStatus,
      lastReviewAt: Date.now() // Track recency of feedback
    };
  } else {
    // Reset if no reviews
    updateData = {
      avgRating: 0,
      totalReviews: 0,
      dealAgainPercentage: 0,
      trustStatus: 'UNRATED'
    };
  }

  // 3. Update Company Document
  await Company.findByIdAndUpdate(companyId, updateData);
  console.log(`[PERSISTENCE] Company reputation updated:`, updateData);
};

// @desc    Update a review
// @route   PUT /api/reviews/:reviewId
// @access  Private (Owner only)
const updateReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment, wouldDealAgain, isAnonymous } = req.body;

  // 1. Auth Check
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized');
  }

  // 2. Find Review
  const review = await Review.findById(reviewId);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // 3. Ownership Check
  if (review.userId.toString() !== req.user.id.toString()) {
    res.status(403);
    throw new Error('You can only edit your own reviews');
  }

  // 4. Update Review
  review.rating = rating !== undefined ? Number(rating) : review.rating;
  review.comment = comment !== undefined ? comment : review.comment;
  review.wouldDealAgain = wouldDealAgain !== undefined ? Boolean(wouldDealAgain) : review.wouldDealAgain;
  review.isAnonymous = isAnonymous !== undefined ? Boolean(isAnonymous) : review.isAnonymous;
  review.updatedAt = Date.now();

  await review.save();

  // 5. Recalculate Company Reputation
  await recalculateReputation(review.companyId);

  // 6. Return Updated Review
  res.status(200).json(review);
});

// @desc    Get all reviews by current user
// @route   GET /api/reviews/user
// @access  Private
const getUserReviews = asyncHandler(async (req, res) => {
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized');
  }

  const reviews = await Review.find({ userId: req.user.id })
    .populate('companyId', 'name city') // Get Company Info
    .sort({ createdAt: -1 });

  res.status(200).json(reviews);
});

// @desc    Get featured reviews for public display (e.g. subscription page)
// @route   GET /api/reviews/featured
// @access  Public (no auth required)
const getFeaturedReviews = asyncHandler(async (req, res) => {
  // Fetch recent reviews (rating >= 3) with user and company info
  // isHidden: { $ne: true } handles docs where the field may not exist
  const reviews = await Review.find({ rating: { $gte: 3 }, isHidden: { $ne: true } })
    .populate('userId', 'companyName role profilePhoto')
    .populate('companyId', 'name city businessType')
    .sort({ rating: -1, createdAt: -1 })
    .limit(10);

  // Format for public display — no sensitive data exposed
  const featured = reviews
    .filter(r => r.userId && r.companyId && r.comment && r.comment.trim().length > 0)
    .map(r => ({
      rating: r.rating,
      comment: r.comment,
      reviewerCompany: r.isAnonymous ? 'Anonymous User' : r.userId.companyName || 'Verified Business',
      reviewerRole: r.userId.role || 'TRADER',
      reviewerPhoto: r.isAnonymous ? null : r.userId.profilePhoto || null,
      companyName: r.companyId.name,
      companyCity: r.companyId.city,
      companyType: r.companyId.businessType,
      createdAt: r.createdAt,
    }));

  res.status(200).json(featured);
});

// @desc    Get recent reviews for home page (True Data)
// @route   GET /api/reviews/recent
// @access  Public
const getRecentReviews = asyncHandler(async (req, res) => {
  // Fetch latest 8 reviews with full details
  const reviews = await Review.find({ 
      rating: { $exists: true }, 
      comment: { $exists: true, $ne: "" },
      isHidden: { $ne: true } 
    })
    .populate({
      path: 'userId',
      select: 'companyName profilePhoto city country role'
    })
    .populate({
      path: 'companyId',
      select: 'name submittedBy domain city businessType' // Fetch submittedBy to get owner's photo as logo
    })
    .sort({ createdAt: -1 })
    .limit(8);

  // Post-process to populate company logo from owner's profile (since companies don't have separate logo field yet)
  const populatedReviews = await Promise.all(reviews.map(async (review) => {
    let companyLogo = null;
    if (review.companyId && review.companyId.submittedBy) {
       // We need to fetch the owner to get their profile photo if it's not populated deep enough
       // Or we can rely on frontend fallback if we don't want to do N+1 queries.
       // Let's do a quick lookup or better yet, Deep Populate in the main query if possible.
       // Mongoose deep populate: .populate({ path: 'companyId', populate: { path: 'submittedBy', select: 'profilePhoto' } })
    }
    return review;
  }));
  
  // Re-query with deep populate for efficiency
  const deepReviews = await Review.find({ 
      rating: { $exists: true }, 
      comment: { $exists: true, $ne: "" },
      isHidden: { $ne: true } 
    })
    .populate({
      path: 'userId',
      select: 'companyName profilePhoto city country role'
    })
    .populate({
      path: 'companyId',
      select: 'name submittedBy city businessType website',
      populate: {
        path: 'submittedBy',
        select: 'profilePhoto'
      }
    })
    .sort({ createdAt: -1 })
    .limit(16);

  const formatted = deepReviews.map(r => {
    // Safety check for missing relations
    if (!r.userId || !r.companyId) return null;

    return {
      _id: r._id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      user: {
        name: r.isAnonymous ? 'Anonymous User' : (r.userId.companyName || 'Anonymous'), // Use Company Name as User Name for B2B context, or fallback
        photo: r.isAnonymous ? null : r.userId.profilePhoto,
        location: r.isAnonymous ? 'Global' : (r.userId.city || 'Global')
      },
      company: {
        id: r.companyId._id,
        name: r.companyId.name,
        logo: r.companyId.submittedBy?.profilePhoto, // Use owner's photo as logo
        domain: r.companyId.website || 'texotrust.com',
        category: r.companyId.businessType || 'Verified Business'
      }
    };
  }).filter(Boolean); // Remove nulls

  res.status(200).json(formatted);
});

// @desc    Add a review by GST number (auto-creates company if needed)
// @route   POST /api/reviews/gst
// @access  Private (Subscribed only)
const addReviewByGst = asyncHandler(async (req, res) => {
  const { gst, rating, comment, wouldDealAgain, gstDetails, isAnonymous } = req.body;

  // 1. Auth & subscription check
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized');
  }
  // Review limit is now enforced by checkReviewLimit middleware
  // No subscription gate here — free users get 5 reviews

  if (!gst || !rating) {
    res.status(400);
    throw new Error('GST number and rating are required');
  }

  const normalizedGst = gst.toUpperCase().trim();

  // 2. Find or create company by GST
  let company = await Company.findOne({ gst: normalizedGst });

  if (!company && gstDetails) {
    // Auto-create a lightweight company from GOV.IN data
    const tradeName = gstDetails.tradeNam || gstDetails.lgnm || 'Unknown Business';
    const address = gstDetails.pradr?.addr || {};
    const city = address.dst || address.stcd || 'Unknown';

    // Extract PAN from GST (characters 3-12)
    const pan = normalizedGst.substring(2, 12);

    try {
      company = await Company.create({
        name: tradeName,
        gst: normalizedGst,
        pan: pan,
        city: city,
        businessType: 'Trader', // Default for auto-created
        submittedBy: null, // No owner
        status: 'APPROVED',
        gstDetails: gstDetails,
        isGstVerified: true,
        verifiedAt: Date.now()
      });
      console.log(`[GST-REVIEW] Auto-created company ${company._id} for GST ${normalizedGst}`);
    } catch (err) {
      // If creation fails due to duplicate PAN, try to find by PAN
      if (err.code === 11000) {
        company = await Company.findOne({ gst: normalizedGst });
        if (!company) {
          res.status(400);
          throw new Error('A company with conflicting identity already exists');
        }
      } else {
        throw err;
      }
    }
  }

  if (!company) {
    res.status(400);
    throw new Error('Could not find or create company for this GST. Please verify the GST number first.');
  }

  // 3. Ownership check
  if (company.submittedBy && company.submittedBy.toString() === req.user.id.toString()) {
    res.status(403);
    throw new Error('You cannot review your own company');
  }

  // 4. Duplicate review check
  const reviewExists = await Review.findOne({
    userId: req.user.id,
    companyId: company._id
  });
  if (reviewExists) {
    res.status(400);
    throw new Error('You have already reviewed this company');
  }

  // 5. Create review
  const review = await Review.create({
    companyId: company._id,
    userId: req.user.id,
    rating: Number(rating),
    wouldDealAgain: Boolean(wouldDealAgain),
    comment,
    isAnonymous: Boolean(isAnonymous)
  });

  // 6. Increment reviewCount on User
  await User.findByIdAndUpdate(req.user.id, { $inc: { reviewCount: 1 } });

  // 7. Recalculate company stats
  await recalcCompanyStats(company._id);
  await recalculateReputation(company._id);

  // 8. Log Activity
  await require('./activityController').logActivity(req.user.id, 'REVIEW', `You reviewed ${company.name}`);
  if (company.submittedBy) {
    await require('./activityController').logActivity(company.submittedBy, 'REVIEW', `Your company ${company.name} received a new review.`);
  }

  console.log(`[GST-REVIEW] Review ${review._id} saved for company ${company._id}`);

  res.status(201).json({ review, companyId: company._id });
});

// @desc    Get review preview (public, limited data)
// @route   GET /api/reviews/preview/:companyId
// @access  Public
const getReviewPreview = asyncHandler(async (req, res) => {
  const { companyId } = req.params;

  // Get total count
  const totalReviews = await Review.countDocuments({ companyId });

  // Get 2 most recent reviews with minimal data
  const previewReviews = await Review.find({ companyId, isHidden: { $ne: true } })
    .select('rating comment createdAt')
    .sort({ createdAt: -1 })
    .limit(2)
    .lean();

  // Truncate review text for preview
  const sanitizedPreviews = previewReviews.map(r => ({
    rating: r.rating,
    text: r.comment ? (r.comment.length > 30 ? r.comment.substring(0, 30) + '...' : r.comment) : '',
    date: r.createdAt
  }));

  // SECURITY: Do NOT return avgRating
  res.status(200).json({
    totalReviews,
    previewReviews: sanitizedPreviews
  });
});

// @desc    Get current user's review for a specific company
// @route   GET /api/reviews/me/:companyId
// @access  Private
const getMyReviewForCompany = asyncHandler(async (req, res) => {
  const { companyId } = req.params;

  const review = await Review.findOne({ 
    companyId, 
    userId: req.user.id 
  }).populate('userId', 'name companyName profilePhoto role isSubscribed');

  if (!review) {
    // Return null or 404
    return res.status(200).json(null);
  }

  // Format similarly to getReviews
  const formatted = {
    id: review._id,
    reviewerId: review.userId?._id,
    reviewerName: review.userId?.name || 'Anonymous',
    reviewerCompany: review.userId?.companyName || null,
    reviewerPhoto: review.userId?.profilePhoto || null,
    role: review.userId?.role || 'Trader',
    isVerified: review.userId?.isSubscribed === true,
    rating: review.rating,
    wouldDealAgain: review.wouldDealAgain,
    isAnonymous: review.isAnonymous,
    date: review.updatedAt || review.createdAt,
    text: review.comment
  };

  res.status(200).json(formatted);
});

// @desc    Delete a review
// @route   DELETE /api/reviews/:reviewId
// @access  Private (Owner only)
const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Only the review author can delete
  if (review.userId.toString() !== req.user.id.toString()) {
    res.status(403);
    throw new Error('You can only delete your own reviews');
  }

  const companyId = review.companyId;
  await Review.findByIdAndDelete(reviewId);

  // Decrement user review count
  await User.findByIdAndUpdate(req.user.id, { $inc: { reviewCount: -1 } });

  // Recalculate company stats
  await recalcCompanyStats(companyId);
  await recalculateReputation(companyId);

  res.status(200).json({ success: true, message: 'Review deleted successfully' });
});

// @desc    Report a review
// @route   POST /api/reviews/:reviewId/report
// @access  Private
const reportReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Prevent reporting own review
  if (review.userId.toString() === req.user.id.toString()) {
    res.status(400);
    throw new Error('You cannot report your own review');
  }

  // Prevent duplicate reports
  if (review.reportedBy && review.reportedBy.includes(req.user.id)) {
    res.status(400);
    throw new Error('You have already reported this review');
  }

  review.reportCount = (review.reportCount || 0) + 1;
  if (!review.reportedBy) review.reportedBy = [];
  review.reportedBy.push(req.user.id);

  // Auto-hide if report count reaches threshold
  if (review.reportCount >= 5) {
    review.isHidden = true;
  }

  await review.save();

  res.status(200).json({ success: true, message: 'Review reported successfully' });
});

// @desc    Toggle helpful stat on a review
// @route   PUT /api/reviews/:reviewId/helpful
// @access  Private
const toggleHelpfulReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Handle arrays not existing on old reviews
  if (!review.helpfulBy) review.helpfulBy = [];
  if (!review.helpfulCount) review.helpfulCount = 0;

  const userIndex = review.helpfulBy.indexOf(req.user.id);
  let isHelpful = false;

  if (userIndex !== -1) {
    // User already marked helpful, unmark
    review.helpfulBy.splice(userIndex, 1);
    review.helpfulCount = Math.max(0, review.helpfulCount - 1);
  } else {
    // User marking helpful
    review.helpfulBy.push(req.user.id);
    review.helpfulCount += 1;
    isHelpful = true;
  }

  await review.save();

  res.status(200).json({ 
    success: true, 
    helpfulCount: review.helpfulCount,
    isHelpful
  });
});

module.exports = {
  getReviews,
  getUserReviews,
  addReview,
  updateReview,
  deleteReview,
  reportReview,
  toggleHelpfulReview,
  getFeaturedReviews,
  getRecentReviews,
  addReviewByGst,
  getReviewPreview,
  getMyReviewForCompany
};
