const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Company = require('../models/Company');

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
  console.log('[DEBUG] Register Request Body:', req.body);
  const { companyName, email, contactNumber, password } = req.body;

  if (!email || !contactNumber || !password) {
    res.status(400);
    throw new Error('Please add all required fields');
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

    // Create user
    const user = await User.create({
      companyName: companyName || '',
      email,
      contactNumber,
      password
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        companyName: user.companyName,
        email: user.email,
        contactNumber: user.contactNumber,
        role: user.role,
        profilePhoto: user.profilePhoto || '',
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
  console.log('[DEBUG] Login Request Body:', req.body);
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
    registeredCompanyId: company ? company._id : null
  });
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateSubscription,
  uploadProfilePhoto,
  upload,
  updateProfile
};
