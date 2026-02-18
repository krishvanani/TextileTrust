const express = require('express');
const router = express.Router();
const { getPlatformStats } = require('../controllers/statsController');

// Public route — no auth required
router.get('/', getPlatformStats);

module.exports = router;
