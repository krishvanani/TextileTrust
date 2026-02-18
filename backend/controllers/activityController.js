const Activity = require('../models/Activity');
const asyncHandler = require('express-async-handler');

// Helper to log activity (internal use)
const logActivity = async (userId, type, message, relatedId = null) => {
  try {
    await Activity.create({
      userId,
      type,
      message,
      relatedId
    });
    console.log(`[ACTIVITY] Logged: ${type} for User ${userId}`);
  } catch (error) {
    console.error(`[ACTIVITY] Failed to log: ${error.message}`);
  }
};

// @desc    Get user activities
// @route   GET /api/activities
// @access  Private
const getActivities = asyncHandler(async (req, res) => {
  const activities = await Activity.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(20); // Limit to last 20

  res.json(activities);
});

module.exports = {
  logActivity,
  getActivities
};
