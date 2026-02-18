const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const { registerUser, loginUser, getMe, uploadProfilePhoto, upload } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.post('/profile-photo', protect, upload.single('profilePhoto'), uploadProfilePhoto);

module.exports = router;
