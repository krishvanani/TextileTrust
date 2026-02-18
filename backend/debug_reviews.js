const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Review = require('./models/Review');

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    const reviews = await Review.find({});
    console.log('Total Reviews:', reviews.length);
    if (reviews.length > 0) {
        console.log('Sample Review:', JSON.stringify(reviews[0], null, 2));
        console.log('Unique "wouldDealAgain" values:', await Review.distinct('wouldDealAgain'));
    }

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

connectDB();
