const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const fixIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const collection = mongoose.connection.db.collection('reviews');
        
        console.log('Listing indexes...');
        const indexes = await collection.indexes();
        console.log(indexes);

        // Find the bad index
        const badIndex = indexes.find(i => i.key.user === 1 && i.key.company === 1);
        if (badIndex) {
            console.log('Found bad index:', badIndex.name);
            await collection.dropIndex(badIndex.name);
            console.log('Dropped bad index.');
        } else {
            console.log('Bad index not found (maybe already dropped).');
        }

        console.log('Done.');
        process.exit();

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixIndexes();
