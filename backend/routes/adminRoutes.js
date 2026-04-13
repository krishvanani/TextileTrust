const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');
const {
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
} = require('../controllers/adminController');

// All routes require authentication + admin role
router.use(protect, requireAdmin);

// Analytics
router.get('/stats', getAdminStats);

// Company Management
router.get('/companies', getAllCompanies);
router.get('/companies/pending', getPendingCompanies);
router.put('/companies/:id/approve', approveCompany);
router.put('/companies/:id/reject', rejectCompany);
router.put('/companies/:id/suspend', suspendCompany);

// Review Moderation
router.get('/reviews', getAllReviews);
router.get('/reviews/reported', getReportedReviews);
router.put('/reviews/:id/hide', hideReview);
router.put('/reviews/:id/unhide', unhideReview);
router.delete('/reviews/:id', deleteReviewAdmin);

// User Management
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-subscription', toggleUserSubscription);

module.exports = router;
