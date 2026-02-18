const Review = require('../models/Review');
const Company = require('../models/Company');

const recalcCompanyStats = async (companyId) => {
  const reviews = await Review.find({ companyId });

  const totalReviews = reviews.length;

  if (totalReviews === 0) {
    await Company.findByIdAndUpdate(companyId, {
      avgRating: 0,
      totalReviews: 0,
      dealAgainPercentage: 0,
    });
    return;
  }

  const sumRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = parseFloat((sumRating / totalReviews).toFixed(1));

  const dealAgainCount = reviews.filter(r => r.wouldDealAgain === true).length;
  const dealAgainPercentage = Math.round((dealAgainCount / totalReviews) * 100);

  await Company.findByIdAndUpdate(companyId, {
    avgRating,
    totalReviews,
    dealAgainPercentage,
  });
};

module.exports = recalcCompanyStats;
