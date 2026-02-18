const Review = require('../models/Review');
const Company = require('../models/Company');
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
    .populate('userId', 'name companyName role isSubscribed ownedCompanyId') // Populate user details
    .sort({ createdAt: -1 });

  res.status(200).json(reviews);
});

// @desc    Add a review
// @route   POST /api/reviews
// @access  Private (Subscribed only)
const addReview = asyncHandler(async (req, res) => {
  console.log('[DEBUG] addReview Endpoint Hit');
  console.log('[DEBUG] Request Header Auth:', req.headers.authorization ? 'Present' : 'Missing');
  console.log('[DEBUG] Request Body:', JSON.stringify(req.body, null, 2));

  const { companyId, rating, comment, wouldDealAgain } = req.body;

  // 1. Authenticate & Subscribe Check
  if (!req.user) {
    console.error('[DEBUG] No user found in request');
    res.status(401);
    throw new Error('Not authorized');
  }
  
  console.log('[DEBUG] User:', req.user._id, 'Subscribed:', req.user.isSubscribed);

  if (!req.user.isSubscribed) {
    console.error('[DEBUG] User not subscribed');
    res.status(403);
    throw new Error('Subscription required to write reviews');
  }

  const company = await Company.findById(companyId);
  if (!company) {
    console.error('[DEBUG] Company not found:', companyId);
    res.status(404);
    throw new Error('Company not found');
  }

  // 4. Ownership Check
  if (company.submittedBy && company.submittedBy.toString() === req.user.id.toString()) {
    console.error('[DEBUG] Optimization: User owns company');
    res.status(403);
    throw new Error('You cannot review your own company');
  }

  // Check for existing review
  const reviewExists = await Review.findOne({
    userId: req.user.id,
    companyId: companyId
  });

  if (reviewExists) {
    console.error('[DEBUG] Duplicate review attempt');
    res.status(400);
    throw new Error('You have already reviewed this company');
  }

  // 5. Create Review (Force DB Write)
  console.log('[PERSISTENCE] Saving review to MongoDB...');
  try {
      const reviewPayload = {
        companyId,
        userId: req.user.id,
        rating: Number(rating),
        wouldDealAgain: Boolean(wouldDealAgain),
        comment
      };
      console.log('[DEBUG] Review Payload:', reviewPayload);

      const review = await Review.create(reviewPayload);

      // Recalculate company stats
      await recalcCompanyStats(companyId);

      // 6. Log Success
      console.log(`[PERSISTENCE] Review saved successfully: ${review._id}`);

      // Log Activity (Reviewer)
      await require('./activityController').logActivity(req.user.id, 'REVIEW', `You reviewed ${company.name}`);

      // Log Activity (Company Owner)
      if (company.submittedBy) {
        await require('./activityController').logActivity(company.submittedBy, 'REVIEW', `Your company ${company.name} received a new review.`);
      }

      // 7. Trigger Recalculation
      await recalculateReputation(companyId);

      // 8. Return Created Review
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
  const { rating, comment, wouldDealAgain } = req.body;

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
    .populate('userId', 'companyName role')
    .populate('companyId', 'name city businessType')
    .sort({ rating: -1, createdAt: -1 })
    .limit(10);

  // Format for public display — no sensitive data exposed
  const featured = reviews
    .filter(r => r.userId && r.companyId && r.comment && r.comment.trim().length > 0)
    .map(r => ({
      rating: r.rating,
      comment: r.comment,
      reviewerCompany: r.userId.companyName || 'Verified Business',
      reviewerRole: r.userId.role || 'TRADER',
      companyName: r.companyId.name,
      companyCity: r.companyId.city,
      companyType: r.companyId.businessType,
      createdAt: r.createdAt,
    }));

  res.status(200).json(featured);
});

module.exports = {
  getReviews,
  getUserReviews,
  addReview,
  updateReview,
  getFeaturedReviews
};
