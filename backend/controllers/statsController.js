const Company = require('../models/Company');
const Review = require('../models/Review');
const asyncHandler = require('express-async-handler');

// @desc    Get platform-wide statistics (real data)
// @route   GET /api/stats
// @access  Public
const getPlatformStats = asyncHandler(async (req, res) => {
  const [companiesVerified, totalReviews, satisfactionAgg, viewsAgg] = await Promise.all([
    // 1. Companies with APPROVED status
    Company.countDocuments({ status: 'APPROVED' }),

    // 2. Total reviews submitted
    Review.countDocuments(),

    // 3. Satisfaction rate: % of reviews with rating >= 4
    Review.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          satisfied: {
            $sum: { $cond: [{ $gte: ['$rating', 4] }, 1, 0] }
          }
        }
      }
    ]),

    // 4. Total views across all companies
    Company.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$viewsCount' }
        }
      }
    ])
  ]);

  // Calculate satisfaction percentage
  let satisfactionRate = 0;
  if (satisfactionAgg.length > 0 && satisfactionAgg[0].total > 0) {
    satisfactionRate = Math.round(
      (satisfactionAgg[0].satisfied / satisfactionAgg[0].total) * 100
    );
  }

  // Extract total views
  const monthlyViews = viewsAgg.length > 0 ? viewsAgg[0].totalViews : 0;

  res.json({
    companiesVerified,
    reviewsSubmitted: totalReviews,
    satisfactionRate,
    monthlyViews
  });
});

module.exports = { getPlatformStats };
