const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Company = require('./models/Company');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find Stark Industries or any company with reviews
    const company = await Company.findOne({ name: 'Stark Industries' });
    if (company) {
        console.log('Company:', company.name);
        console.log('dealAgainPercentage:', company.dealAgainPercentage);
        console.log('totalReviews:', company.totalReviews);
    } else {
        console.log('Stark Industries not found, dumping first company with reviews');
        const c = await Company.findOne({ totalReviews: { $gt: 0 } });
        if(c) console.log(JSON.stringify(c, null, 2));
    }

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

connectDB();
