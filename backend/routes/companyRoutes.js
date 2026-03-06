const express = require('express');
const router = express.Router();
const {
  registerCompany,
  getCompanyById,
  searchCompanies,
  getSearchSuggestions,
  getTrendingCompanies,
  checkCompanyIdentity,
  uploadBusinessCard,
  uploadMiddleware,
  updateCompany
} = require('../controllers/companyController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');

router.post('/register', protect, registerCompany);
// Business Card Upload Route
router.post(
  '/business-card', 
  protect, 
  uploadMiddleware.fields([
    { name: 'front', maxCount: 1 }, 
    { name: 'back', maxCount: 1 }
  ]), 
  uploadBusinessCard
);

router.get('/search', searchCompanies);
router.get('/suggestions', getSearchSuggestions); // Public access for landing page UX
router.get('/trending', getTrendingCompanies); // Public access for Trending Feature
router.get('/check-identity', protect, checkCompanyIdentity); // Early validation
router.get('/:id', optionalAuth, getCompanyById);
router.put('/:id', protect, updateCompany);

module.exports = router;
