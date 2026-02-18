const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Company = require('./models/Company');
const Review = require('./models/Review');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

const recalculateAll = async () => {
  await connectDB();
  const companies = await Company.find({});
  console.log(`Found ${companies.length} companies to update.`);

  for (const company of companies) {
    console.log(`Processing: ${company.name} (${company._id})`);
    
    // 1. Fetch reviews
    const stats = await Review.aggregate([
      { $match: { companyId: company._id } },
      {
        $group: {
          _id: '$companyId',
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          dealAgainCount: {
            $sum: { $cond: [{ $eq: ['$wouldDealAgain', true] }, 1, 0] }
          }
        }
      }
    ]);

    let updateData = {};

    if (stats.length > 0) {
      const { avgRating, totalReviews, dealAgainCount } = stats[0];
      const dealAgainPercentage = (dealAgainCount / totalReviews) * 100;
      const roundedRating = Number(avgRating.toFixed(1));
      const roundedDealAgain = Math.round(dealAgainPercentage);

      // Determine Trust Status (NEW LOGIC)
      let trustStatus = 'UNRATED';

      if (roundedRating >= 4.0 && roundedDealAgain >= 70) {
        trustStatus = 'TRUSTED';
      } else if (roundedRating < 2.5 || roundedDealAgain < 40) {
        trustStatus = 'LOW_TRUST';
      } else {
        trustStatus = 'CAUTION';
      }

      updateData = {
        avgRating: roundedRating,
        totalReviews: totalReviews,
        dealAgainPercentage: roundedDealAgain,
        trustStatus: trustStatus
      };
      
      console.log(` -> New Status: ${trustStatus} (Rating: ${roundedRating}, DealAgain: ${roundedDealAgain}%)`);
    } else {
      updateData = {
        avgRating: 0,
        totalReviews: 0,
        dealAgainPercentage: 0,
        trustStatus: 'UNRATED'
      };
      console.log(` -> No reviews. Status: UNRATED`);
    }

    await Company.findByIdAndUpdate(company._id, updateData);
  }

  console.log('All companies updated.');
  process.exit();
};

recalculateAll();
