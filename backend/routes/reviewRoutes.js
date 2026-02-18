const express = require('express');
const router = express.Router();
const { getReviews, getUserReviews, addReview, updateReview, getFeaturedReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

// Public route — must be above /:companyId to avoid conflict
router.get('/featured', getFeaturedReviews);

router.get('/user', protect, getUserReviews);

router.route('/')
  .post(protect, addReview);

router.route('/:companyId')
  .get(protect, getReviews);

router.route('/edit/:reviewId')
  .put(protect, updateReview);

module.exports = router;
