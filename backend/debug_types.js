const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Company = require('./models/Company');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const types = await Company.distinct('businessType');
    console.log('Distinct Business Types in DB:', types);
    
    const count = await Company.countDocuments({});
    console.log('Total Companies:', count);

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

connectDB();
