const express = require('express');
const router = express.Router();
const { activateSubscription, getMySubscription } = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/activate', protect, activateSubscription);
router.get('/my', protect, getMySubscription);

module.exports = router;
