const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // Ensure Indexes
        const Company = require('./models/Company');
        
        console.log('Syncing indexes for Company model...');
        await Company.syncIndexes();
        
        // List indexes to verify
        const indexes = await Company.collection.indexes();
        console.log('Current Indexes on Company collection:');
        console.log(JSON.stringify(indexes, null, 2));

        console.log('SUCCESS: Indexes enforced.');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

connectDB();
