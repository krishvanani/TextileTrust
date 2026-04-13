const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Company = require('../models/Company');
const Review = require('../models/Review');
const Subscription = require('../models/Subscription');
const recalcCompanyStats = require('../utils/recalcCompanyStats');
const mongoose = require('mongoose');

// ─────────────────────────────────────────────
//  A. PLATFORM OVERVIEW / ANALYTICS
// ─────────────────────────────────────────────

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getAdminStats = asyncHandler(async (req, res) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    totalUsers,
    totalCompanies,
    pendingCompanies,
    approvedCompanies,
    rejectedCompanies,
    totalReviews,
    reportedReviews,
    totalSubscriptions,
    newUsersThisWeek,
    newCompaniesThisWeek,
    newReviewsThisWeek
  ] = await Promise.all([
    User.countDocuments({ role: { $ne: 'ADMIN' } }),
    Company.countDocuments(),
    Company.countDocuments({ status: 'PENDING' }),
    Company.countDocuments({ status: 'APPROVED' }),
    Company.countDocuments({ status: 'REJECTED' }),
    Review.countDocuments(),
    Review.countDocuments({ reportCount: { $gte: 1 } }),
    User.countDocuments({ isSubscribed: true, role: { $ne: 'ADMIN' } }),
    User.countDocuments({ createdAt: { $gte: sevenDaysAgo }, role: { $ne: 'ADMIN' } }),
    Company.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    Review.countDocuments({ createdAt: { $gte: sevenDaysAgo } })
  ]);

  res.json({
    totalUsers,
    totalCompanies,
    pendingCompanies,
    approvedCompanies,
    rejectedCompanies,
    totalReviews,
    reportedReviews,
    totalSubscriptions,
    newUsersThisWeek,
    newCompaniesThisWeek,
    newReviewsThisWeek
  });
});

// ─────────────────────────────────────────────
//  B. COMPANY MANAGEMENT
// ─────────────────────────────────────────────

// @desc    Get all companies (paginated)
// @route   GET /api/admin/companies?status=PENDING&page=1&limit=20
// @access  Private (Admin)
const getAllCompanies = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (status && status !== 'ALL') {
    filter.status = status;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [companies, total] = await Promise.all([
    Company.find(filter)
      .populate('submittedBy', 'companyName email contactNumber profilePhoto')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Company.countDocuments(filter)
  ]);

  res.json({ companies, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
});

// @desc    Get pending companies
// @route   GET /api/admin/companies/pending
// @access  Private (Admin)
const getPendingCompanies = asyncHandler(async (req, res) => {
  const companies = await Company.find({ status: 'PENDING' })
    .populate('submittedBy', 'companyName email contactNumber profilePhoto')
    .sort({ createdAt: -1 })
    .lean();

  res.json(companies);
});

// @desc    Approve a company
// @route   PUT /api/admin/companies/:id/approve
// @access  Private (Admin)
const approveCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) {
    res.status(404);
    throw new Error('Company not found');
  }

  company.status = 'APPROVED';
  company.verifiedAt = Date.now();
  await company.save({ validateBeforeSave: false });

  console.log(`[ADMIN] Company ${company._id} approved by admin ${req.user.id}`);
  res.json({ success: true, message: `${company.name} has been approved.`, company });
});

// @desc    Reject a company
// @route   PUT /api/admin/companies/:id/reject
// @access  Private (Admin)
const rejectCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) {
    res.status(404);
    throw new Error('Company not found');
  }

  company.status = 'REJECTED';
  await company.save({ validateBeforeSave: false });

  console.log(`[ADMIN] Company ${company._id} rejected by admin ${req.user.id}`);
  res.json({ success: true, message: `${company.name} has been rejected.`, company });
});

// @desc    Suspend a company (set to REJECTED)
// @route   PUT /api/admin/companies/:id/suspend
// @access  Private (Admin)
const suspendCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) {
    res.status(404);
    throw new Error('Company not found');
  }

  company.status = 'REJECTED';
  await company.save({ validateBeforeSave: false });

  console.log(`[ADMIN] Company ${company._id} suspended by admin ${req.user.id}`);
  res.json({ success: true, message: `${company.name} has been suspended.`, company });
});

// ─────────────────────────────────────────────
//  C. REVIEW MODERATION
// ─────────────────────────────────────────────

// @desc    Get all reviews (paginated)
// @route   GET /api/admin/reviews?page=1&limit=20
// @access  Private (Admin)
const getAllReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [reviews, total] = await Promise.all([
    Review.find()
      .populate('userId', 'companyName email profilePhoto role')
      .populate('companyId', 'name gst city')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Review.countDocuments()
  ]);

  res.json({ reviews, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
});

// @desc    Get reported reviews
// @route   GET /api/admin/reviews/reported
// @access  Private (Admin)
const getReportedReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ reportCount: { $gte: 1 } })
    .populate('userId', 'companyName email profilePhoto role')
    .populate('companyId', 'name gst city')
    .sort({ reportCount: -1 })
    .lean();

  res.json(reviews);
});

// @desc    Hide a review
// @route   PUT /api/admin/reviews/:id/hide
// @access  Private (Admin)
const hideReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  review.isHidden = true;
  await review.save();

  console.log(`[ADMIN] Review ${review._id} hidden by admin ${req.user.id}`);
  res.json({ success: true, message: 'Review hidden successfully.' });
});

// @desc    Unhide a review
// @route   PUT /api/admin/reviews/:id/unhide
// @access  Private (Admin)
const unhideReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  review.isHidden = false;
  await review.save();

  console.log(`[ADMIN] Review ${review._id} unhidden by admin ${req.user.id}`);
  res.json({ success: true, message: 'Review unhidden successfully.' });
});

// @desc    Delete a review (admin override)
// @route   DELETE /api/admin/reviews/:id
// @access  Private (Admin)
const deleteReviewAdmin = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  const companyId = review.companyId;
  const userId = review.userId;

  await Review.findByIdAndDelete(req.params.id);

  // Decrement reviewer's review count
  await User.findByIdAndUpdate(userId, { $inc: { reviewCount: -1 } });

  // Recalculate company stats
  if (companyId) {
    await recalcCompanyStats(companyId);
  }

  console.log(`[ADMIN] Review ${req.params.id} deleted by admin ${req.user.id}`);
  res.json({ success: true, message: 'Review deleted permanently.' });
});

// ─────────────────────────────────────────────
//  D. USER / SUBSCRIPTION MANAGEMENT
// ─────────────────────────────────────────────

// @desc    Get all users
// @route   GET /api/admin/users?page=1&limit=50
// @access  Private (Admin)
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [users, total] = await Promise.all([
    User.find({ role: { $ne: 'ADMIN' } })
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    User.countDocuments({ role: { $ne: 'ADMIN' } })
  ]);

  res.json({ users, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
});

// @desc    Toggle user subscription (admin override)
// @route   PUT /api/admin/users/:id/toggle-subscription
// @access  Private (Admin)
const toggleUserSubscription = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.role === 'ADMIN') {
    res.status(400);
    throw new Error('Cannot modify admin subscription');
  }

  user.isSubscribed = !user.isSubscribed;

  // If activating, create a subscription record
  if (user.isSubscribed) {
    const existingSub = await Subscription.findOne({ userId: user._id, status: 'ACTIVE' });
    if (!existingSub) {
      const sub = await Subscription.create({
        userId: user._id,
        status: 'ACTIVE',
        companySnapshot: { adminOverride: true }
      });
      user.subscription = {
        id: sub._id,
        status: 'ACTIVE',
        activatedAt: new Date()
      };
    }
  } else {
    // Deactivate
    await Subscription.updateMany(
      { userId: user._id, status: 'ACTIVE' },
      { status: 'INACTIVE' }
    );
    user.subscription = {
      status: 'INACTIVE'
    };
  }

  await user.save({ validateBeforeSave: false });

  console.log(`[ADMIN] User ${user._id} subscription toggled to ${user.isSubscribed} by admin ${req.user.id}`);
  res.json({
    success: true,
    message: `Subscription ${user.isSubscribed ? 'activated' : 'deactivated'} for ${user.companyName || user.email}.`,
    user
  });
});

module.exports = {
  getAdminStats,
  getAllCompanies,
  getPendingCompanies,
  approveCompany,
  rejectCompany,
  suspendCompany,
  getAllReviews,
  getReportedReviews,
  hideReview,
  unhideReview,
  deleteReviewAdmin,
  getAllUsers,
  toggleUserSubscription
};
