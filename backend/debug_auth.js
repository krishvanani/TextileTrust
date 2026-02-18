const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("❌ MONGO_URI is undefined in .env");
  process.exit(1);
}

// Mask password for display
const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
console.log(`Attempting to connect to: ${maskedUri}`);

mongoose.connect(uri)
  .then(() => {
    console.log("✅ Connection Successful!");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Connection Failed:");
    console.error(err.message);
    process.exit(1);
  });
