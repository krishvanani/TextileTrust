const express = require('express');
const router = express.Router();
const { getReviews, getUserReviews, addReview, updateReview, deleteReview, reportReview, toggleHelpfulReview, getFeaturedReviews, getRecentReviews, addReviewByGst, getReviewPreview, getMyReviewForCompany } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const checkReviewLimit = require('../middleware/checkReviewLimit');

// Public routes — must be above /:companyId to avoid conflict
router.get('/featured', getFeaturedReviews);
router.get('/recent', getRecentReviews);
router.get('/preview/:companyId', getReviewPreview); // Public preview (no auth)

router.get('/user', protect, getUserReviews);
router.get('/me/:companyId', protect, getMyReviewForCompany);

router.route('/')
  .post(protect, checkReviewLimit, addReview);

router.post('/gst', protect, checkReviewLimit, addReviewByGst);

router.route('/:companyId')
  .get(protect, getReviews);

router.route('/edit/:reviewId')
  .put(protect, updateReview);

router.delete('/:reviewId', protect, deleteReview);
router.post('/:reviewId/report', protect, reportReview);
router.put('/:reviewId/helpful', protect, toggleHelpfulReview);

module.exports = router;

