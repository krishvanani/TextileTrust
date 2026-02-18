
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load env vars
dotenv.config();

const createAdmin = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    const adminEmail = 'admin@textiletrust.com';
    const adminPassword = 'AdminPassword123!';
    const adminPhone = '9999999999';

    // Check if admin exists
    const userExists = await User.findOne({ email: adminEmail });

    if (userExists) {
      console.log('Admin user already exists');
      process.exit();
    }

    // Create admin user
    const user = await User.create({
      companyName: 'TextileTrust Admin',
      email: adminEmail,
      contactNumber: adminPhone,
      password: adminPassword,
      role: 'ADMIN',
      isSubscribed: true // Admins are subscribed by default/irrelevant
    });

    console.log('Admin user created successfully');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);

    process.exit();
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();
