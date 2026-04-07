const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Company = require('../models/Company');
const { verifyFirebaseToken } = require('../config/firebase');

// Multer config for profile photo uploads
const uploadsDir = path.join(__dirname, '..', 'uploads', 'profiles');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  }
});

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { companyName, email, contactNumber, password, gstData, firebaseIdToken } = req.body;

  if (!email || !contactNumber || !password) {
    res.status(400);
    throw new Error('Please add all required fields');
  }

  // Verify Firebase phone authentication token
  if (firebaseIdToken) {
    try {
      const decodedToken = await verifyFirebaseToken(firebaseIdToken);
      if (decodedToken) {
        // Normalize phone numbers for comparison (remove spaces, dashes)
        const tokenPhone = (decodedToken.phone_number || '').replace(/[\s-]/g, '');
        const inputPhone = contactNumber.replace(/[\s-]/g, '');
        // Check if the verified phone matches (with or without +91 prefix)
        const normalizedToken = tokenPhone.replace(/^\+91/, '');
        const normalizedInput = inputPhone.replace(/^\+91/, '');
        
        if (normalizedToken !== normalizedInput) {
          res.status(400);
          throw new Error('Phone number does not match verified number');
        }
        console.log('✅ Phone verified via Firebase:', tokenPhone);
      }
    } catch (error) {
      if (error.message === 'Phone number does not match verified number') {
        throw error;
      }
      // If Firebase Admin is not configured, log warning but allow registration
      console.warn('⚠️ Firebase token verification skipped:', error.message);
    }
  } else {
    console.warn('⚠️ No Firebase token provided — phone not verified via OTP');
  }

  // Password Security Validation
  const passwordError = validatePassword(password, { companyName: companyName || '', email, contactNumber });
  if (passwordError) {
    res.status(400);
    throw new Error(passwordError);
  }

  try {
    // Check if user exists (Manual check for better specific error messages if needed, 
    // but duplicate key catch is the safety net)
    const userExists = await User.findOne({ $or: [{ email }, { contactNumber }] });

    if (userExists) {
        res.status(409); // Conflict
        throw new Error(userExists.email === email ? 'User with this email already exists' : 'User with this contact number already exists');
    }

    // Build user data
    const userData = {
      companyName: (gstData?.companyName) || companyName || '',
      email,
      contactNumber,
      password
    };

    // If verified GST data was provided, store it in companySnapshot
    if (gstData && gstData.gstNumber) {
      // Check if another user already has this GST number
      const existingGstUser = await User.findOne({ 'companySnapshot.gstNumber': gstData.gstNumber });
      const existingCompany = await Company.findOne({ gst: gstData.gstNumber });

      if (existingGstUser || existingCompany) {
        res.status(409);
        throw new Error('A user with this GST number is already registered.');
      }

      userData.companySnapshot = {
        gstNumber: gstData.gstNumber,
        companyName: gstData.companyName || '',
        city: gstData.city || '',
        businessType: gstData.businessType || '',
      };
    }

    // Create user
    const user = await User.create(userData);

    if (user) {
      res.status(201).json({
        _id: user.id,
        companyName: user.companyName,
        email: user.email,
        contactNumber: user.contactNumber,
        role: user.role,
        profilePhoto: user.profilePhoto || '',
        companySnapshot: user.companySnapshot || null,
        reviewCount: 0,
        token: generateToken(user._id)
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    // Handle MongoDB Duplicate Key Error (Safety net)
    if (error.code === 11000) {
        res.status(409);
        const field = Object.keys(error.keyValue)[0];
        throw new Error(`User with this ${field} already exists`);
    }
    throw error;
  }
});

// Helper: Validate Password Strength
const validatePassword = (password, userInfo) => {
  if (password.length < 8) return 'Password must be at least 8 characters';
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*]/.test(password);

  if (!hasUpperCase) return 'Password must contain at least one uppercase letter';
  if (!hasLowerCase) return 'Password must contain at least one lowercase letter';
  if (!hasNumber) return 'Password must contain at least one number';
  if (!hasSpecialChar) return 'Password must contain at least one special character (!@#$%^&*)';

  // Common weak passwords
  const commonPasswords = ['password', '12345678', 'qwerty', 'admin123'];
  if (commonPasswords.some(cp => password.toLowerCase().includes(cp))) {
    return 'Password contains a common, easily guessable pattern';
  }

  // Contextual checks
  const { companyName, email, contactNumber } = userInfo;
  if (companyName && password.toLowerCase().includes(companyName.toLowerCase())) return 'Password must not contain your company name';
  if (email && password.toLowerCase().includes(email.toLowerCase().split('@')[0])) return 'Password must not contain your email handle';
  if (contactNumber && password.includes(contactNumber)) return 'Password must not contain your phone number';

  return null;
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (await user.matchPassword(password)) {
    // Check if user has registered a company
    const company = await Company.findOne({ submittedBy: user._id });

    res.json({
      _id: user.id,
      companyName: user.companyName,
      email: user.email,
      role: user.role,
      contactNumber: user.contactNumber,
      isSubscribed: user.isSubscribed,
      subscription: user.subscription,
      createdAt: user.createdAt,
      ownedCompanyId: user.ownedCompanyId,
      profilePhoto: user.profilePhoto || '',
      companySnapshot: user.companySnapshot || null,
      reviewCount: user.reviewCount || 0,
      token: generateToken(user._id),
      registeredCompanyId: company ? company._id : null
    });
  } else {
    res.status(401);
    throw new Error('Invalid password');
  }
});

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  const company = await Company.findOne({ submittedBy: req.user.id });

  if (user) {
    res.json({
      _id: user._id,
      companyName: user.companyName,
      email: user.email,
      role: user.role,
      contactNumber: user.contactNumber,
      isSubscribed: user.isSubscribed,
      subscription: user.subscription,
      createdAt: user.createdAt,
      ownedCompanyId: user.ownedCompanyId,
      profilePhoto: user.profilePhoto || '',
      companySnapshot: user.companySnapshot || null,
      reviewCount: user.reviewCount || 0,
      registeredCompanyId: company ? company._id : null
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Update user subscription status
// @route   PUT /api/auth/subscribe
// @access  Private
const updateSubscription = asyncHandler(async (req, res) => {
  res.status(400).json({ message: 'Use /api/subscription/activate instead' });
});

// @desc    Upload profile photo
// @route   POST /api/auth/profile-photo
// @access  Private
const uploadProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image');
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Delete old photo if exists
  if (user.profilePhoto) {
    const oldPath = path.join(__dirname, '..', user.profilePhoto);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  // Save new photo path
  const photoPath = `/uploads/profiles/${req.file.filename}`;
  user.profilePhoto = photoPath;
  await user.save();

  res.json({
    success: true,
    profilePhoto: photoPath
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Whitelist editable fields
  const allowedFields = ['companyName', 'email', 'contactNumber'];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    res.status(400);
    throw new Error('No valid fields to update');
  }

  // Check for duplicate email
  if (updates.email && updates.email !== user.email) {
    const emailExists = await User.findOne({ email: updates.email });
    if (emailExists) {
      res.status(409);
      throw new Error('Email is already in use');
    }
  }

  // Check for duplicate contact number
  if (updates.contactNumber && updates.contactNumber !== user.contactNumber) {
    const phoneExists = await User.findOne({ contactNumber: updates.contactNumber });
    if (phoneExists) {
      res.status(409);
      throw new Error('Contact number is already in use');
    }
  }

  Object.assign(user, updates);
  await user.save();

  const company = await Company.findOne({ submittedBy: user._id });

  res.json({
    _id: user._id,
    companyName: user.companyName,
    email: user.email,
    role: user.role,
    contactNumber: user.contactNumber,
    isSubscribed: user.isSubscribed,
    subscription: user.subscription,
    createdAt: user.createdAt,
    ownedCompanyId: user.ownedCompanyId,
    profilePhoto: user.profilePhoto || '',
    companySnapshot: user.companySnapshot || null,
    reviewCount: user.reviewCount || 0,
    registeredCompanyId: company ? company._id : null
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Please provide both current and new password');
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Verify current password
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  // Validate new password strength
  const passwordError = validatePassword(newPassword, {
    companyName: user.companyName || '',
    email: user.email,
    contactNumber: user.contactNumber
  });
  if (passwordError) {
    res.status(400);
    throw new Error(passwordError);
  }

  // Prevent reusing same password
  const isSame = await user.matchPassword(newPassword);
  if (isSame) {
    res.status(400);
    throw new Error('New password must be different from current password');
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password changed successfully' });
});

// @desc    Check if GST exists
// @route   POST /api/auth/check-gst
// @access  Public
const checkGst = asyncHandler(async (req, res) => {
  const { gst } = req.body;
  if (!gst) {
    res.status(400);
    throw new Error('Please provide a GST number');
  }

  const existingGstUser = await User.findOne({ 'companySnapshot.gstNumber': gst });
  const existingCompany = await Company.findOne({ gst: gst });

  if (existingGstUser || existingCompany) {
    res.status(409);
    throw new Error('A user with this GST number is already registered.');
  }

  res.json({ success: true, message: 'GST is available' });
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateSubscription,
  uploadProfilePhoto,
  upload,
  updateProfile,
  changePassword,
  checkGst
};
