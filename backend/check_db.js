const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

const checkData = async () => {
    await connectDB();

    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    const companies = await mongoose.connection.db.collection('companies').find({}).toArray();
    const reviews = await mongoose.connection.db.collection('reviews').find({}).toArray();

    console.log(JSON.stringify({
        userCount: users.length,
        companyCount: companies.length,
        reviewCount: reviews.length,
        users: users.map(u => ({ id: u._id, name: u.name, sub: u.isSubscribed })),
        companies: companies.map(c => ({ 
            id: c._id, 
            name: c.name, 
            avgRating: c.avgRating, 
            totalReviews: c.totalReviews,
            dealAgain: c.dealAgainPercentage 
        })),
        reviews: reviews.map(r => ({ 
            id: r._id, 
            companyId: r.companyId, 
            userId: r.userId, 
            rating: r.rating,
            wouldDealAgain: r.wouldDealAgain
        }))
    }, null, 2));

    process.exit();
};

checkData();
