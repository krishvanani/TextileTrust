const asyncHandler = require('express-async-handler');

/**
 * @desc Middleware to restrict access to ADMIN role only.
 * Must be used AFTER the `protect` middleware so req.user is populated.
 */
const requireAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403);
    throw new Error('Access denied. Admin privileges required.');
  }
  next();
});

module.exports = { requireAdmin };
