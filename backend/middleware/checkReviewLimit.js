const asyncHandler = require('express-async-handler');
const User = require('../models/User');

/**
 * Middleware: checkReviewLimit
 * Enforces the 5 free review limit for non-subscribed users.
 * 
 * Flow:
 *   - No user → 401
 *   - reviewCount < 5 → allow
 *   - isSubscribed → allow
 *   - else → 403
 */
const checkReviewLimit = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized');
  }

  // Fetch fresh reviewCount from DB (never trust frontend)
  const freshUser = await User.findById(req.user.id).select('reviewCount isSubscribed');
  if (!freshUser) {
    res.status(401);
    throw new Error('User not found');
  }

  // Subscribed users have unlimited reviews
  if (freshUser.isSubscribed) {
    return next();
  }

  // Free users get 5 reviews
  if (freshUser.reviewCount < 5) {
    return next();
  }

  // Limit reached
  res.status(403);
  throw new Error('You have used all 5 free reviews. Please subscribe to continue writing reviews.');
});

module.exports = checkReviewLimit;
