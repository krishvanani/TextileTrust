const Company = require('../models/Company');
const asyncHandler = require('express-async-handler');
const { logActivity } = require('./activityController');
const Activity = require('../models/Activity');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// @desc    Register a new company
// @route   POST /api/companies/register
// @access  Private (Subscribed only)
const registerCompany = asyncHandler(async (req, res) => {
  if (!req.user.isSubscribed) {
    res.status(403);
    throw new Error('Subscription required to register a company');
  }

  // Check if user already has a company
  const existingCompany = await Company.findOne({ submittedBy: req.user.id });
  if (existingCompany) {
    res.status(400);
    throw new Error('You have already registered a company');
  }

  const {
    name,
    gst,
    pan,
    city,
    businessType,
    contactPerson,
    officialEmail,
    officialPhone,
    gstDetails,
    isGstVerified
  } = req.body;

  // Normalize Identity Documents
  const normalizedGst = gst?.toUpperCase().trim();
  const normalizedPan = pan?.toUpperCase().trim();

  // Check if GST exists (Manual check can be kept for custom error, but try/catch catches it too)
  const gstExists = await Company.findOne({ gst: normalizedGst });
  if (gstExists) {
    res.status(400);
    throw new Error('Company with this GST already exists');
  }

  // Check if PAN exists
  const panExists = await Company.findOne({ pan: normalizedPan });
  if (panExists) {
    res.status(400);
    throw new Error('Company with this PAN already exists');
  }

  try {
    console.log('[PERSISTENCE] Saving company to MongoDB...');
    const company = await Company.create({
      name,
      gst: normalizedGst,
      pan: normalizedPan,
      city,
      businessType,
      contactPerson,
      officialEmail,
      officialPhone,
      gstDetails: gstDetails || null,
      isGstVerified: isGstVerified || false,
      submittedBy: req.user.id,
      status: 'APPROVED', // Auto-approve for MVP
      verifiedAt: Date.now()
    });

    console.log(`[PERSISTENCE] Company saved: ${company._id}`);

    // Update User with ownedCompanyId
    await require('../models/User').findByIdAndUpdate(req.user.id, {
      ownedCompanyId: company._id
    });
    console.log(`[PERSISTENCE] User ${req.user.id} linked to Company ${company._id}`);

    // Log Activity
    await logActivity(req.user.id, 'COMPANY_REGISTERED', `You registered ${company.name} successfully.`);

    res.status(201).json(company);
  } catch (error) {
    console.error('[PERSISTENCE] Company Creation Failed:', error);
    
    if (error.code === 11000) {
      res.status(400);
      const field = Object.keys(error.keyValue)[0];
      if (field === 'gst') throw new Error('Company with this GST number already exists');
      if (field === 'pan') throw new Error('Company with this PAN number already exists');
      throw new Error(`${field} already exists`);
    }

    res.status(400);
    throw error;
  }
});

// @desc    Get company by ID
// @route   GET /api/companies/:id
// @access  Private (Subscribed only)
const getCompanyById = asyncHandler(async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('submittedBy', 'profilePhoto');
    if (!company) return res.status(404).json({ message: 'Company not found' });

    // Increment Views Logic
    // Only increment if:
    // 1. Visitor has a company (req.user.ownedCompanyId exists)
    // 2. Visitor is NOT viewing their own company
    // 3. Visitor hasn't viewed this company recently (24h)
    const visitorHasCompany = req.user?.ownedCompanyId;
    const isVisitingOwnCompany = visitorHasCompany && visitorHasCompany.toString() === company._id.toString();

    if (visitorHasCompany && !isVisitingOwnCompany) {
       // Check for recent view (24 hours)
       const recentView = await Activity.findOne({
          userId: req.user.id,
          type: 'COMPANY_VIEWED',
          relatedId: company._id,
          createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24 hours ago
       });

       if (!recentView) {
          company.viewsCount = (company.viewsCount || 0) + 1;
          await company.save({ validateBeforeSave: false }); 
          
          // Log the view to prevent re-increment
          await logActivity(req.user.id, 'COMPANY_VIEWED', `Viewed company ${company.name}`, company._id);
       }
    }
    
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Search companies
// @route   GET /api/companies/search
// @access  Private (Subscribed only)
const searchCompanies = asyncHandler(async (req, res) => {
  // Public access enabled
  // subscription check removed


  const { query, category } = req.query;

  let companies = [];
  let filter = {};

  // 1. Text Search
  if (query) {
    filter.$or = [
      { name: { $regex: query, $options: 'i' } },
      { gst: { $regex: query, $options: 'i' } },
      { pan: { $regex: query, $options: 'i' } }
    ];
  }

  // 2. Category Filter
  if (category && category !== 'All') {
    filter.businessType = category;
  }

  // If no query and no category, return recent.
  // BUT if category is selected without query, we should return all in that category.
  
  if (Object.keys(filter).length > 0) {
      companies = await Company.find(filter)
        .select('name gst city status verifiedAt avgRating totalReviews businessType submittedBy')
        .populate('submittedBy', 'profilePhoto')
        .sort({ createdAt: -1 });
  } else {
    // Default: Return all or recent if nothing selected
    companies = await Company.find({}).limit(20).sort({ createdAt: -1 }).populate('submittedBy', 'profilePhoto'); 
  }

  res.json(companies);
});

// @desc    Get search suggestions
// @route   GET /api/companies/suggestions
// @access  Public
const getSearchSuggestions = asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query || query.length < 2) {
    return res.json([]);
  }

  const normalizedQuery = query.trim();

  // Limit 5, Select minimal fields
  const suggestions = await Company.find({
    $or: [
      { name: { $regex: normalizedQuery, $options: 'i' } },
      { gst: { $regex: '^' + normalizedQuery, $options: 'i' } } // Starts with
    ],
    status: 'APPROVED' // Only clean data
  })
  .select('name gst _id submittedBy')
  .populate('submittedBy', 'profilePhoto')
  .limit(5);

  res.json(suggestions);
});

// @desc    Get trending companies
// @route   GET /api/companies/trending
// @access  Public
const getTrendingCompanies = asyncHandler(async (req, res) => {
  // Fetch candidates (Clean data only)
  // Logic: AvgRating >= 3.5, TotalReviews >= 3
  // Fetch candidates (Clean data only)
  // Logic: AvgRating >= 3.5, TotalReviews >= 3, No Caution/Low Trust
  const candidates = await Company.find({
    status: 'APPROVED',
    avgRating: { $gte: 3.5 },
    totalReviews: { $gte: 3 },
    trustStatus: { $nin: ['CAUTION', 'LOW_TRUST', 'BLOCKED'] } // Explicitly exclude bad actors
  })
  .select('name avgRating totalReviews viewsCount trustStatus lastReviewAt dealAgainPercentage _id submittedBy')
  .populate('submittedBy', 'profilePhoto')
  .lean();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Calculate Score
  const scoredCompanies = candidates.map(company => {
    let score = 0;
    
    // 1. Base Engagement
    score += (company.totalReviews || 0) * 1; 
    score += (company.viewsCount || 0) * 0.05;
    
    // 2. Quality Multiplier
    score += (company.avgRating || 0) * 5; // Increased weight for rating (was 3)

    // 3. Trust Boost (CRITICAL for "Most Trusted" section)
    if (company.trustStatus === 'TRUSTED') {
        score += 50; // Huge boost to ensure they appear first
    }

    // 4. Recency Boost
    if (company.lastReviewAt && new Date(company.lastReviewAt) > sevenDaysAgo) {
      score += 10; // Significant boost for active feedback
    }

    return { ...company, trendingScore: score };
  });

  // Sort by Score DESC, Limit 5
  const trending = scoredCompanies
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, 5);

  res.json(trending);
});

// @desc    Check if company exists by GST or PAN
// @route   GET /api/companies/check-identity
// @access  Private
const checkCompanyIdentity = asyncHandler(async (req, res) => {
  const { gst, pan } = req.query;
  
  if (!gst && !pan) {
    res.status(400);
    throw new Error('Please provide GST or PAN to check');
  }

  let matchSource = null;
  let company = null;

  if (gst) {
    const normalizedGst = gst.toUpperCase().trim();
    company = await Company.findOne({ gst: normalizedGst });
    if (company) matchSource = 'GST';
  }

  if (!company && pan) {
    const normalizedPan = pan.toUpperCase().trim();
    company = await Company.findOne({ pan: normalizedPan });
    if (company) matchSource = 'PAN';
  }

  if (company) {
    return res.json({
      exists: true,
      matchSource,
      companyId: company._id,
      companyName: company.name
    });
  }

  res.json({ exists: false });
});

// Configure Multer for Business Cards
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '..', 'uploads', 'business-cards'); // Use absolute path
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'bc-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadMiddleware = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only images are allowed'));
    }
});

// @desc    Upload Business Card
// @route   POST /api/companies/business-card
// @access  Private
const uploadBusinessCard = asyncHandler(async (req, res) => {
    // 1. Check Subscription
    if (!req.user.isSubscribed) {
        res.status(403);
        throw new Error('Access denied. Active subscription required.');
    }

    // 2. Check Files
    if (!req.files || (!req.files.front && !req.files.back)) {
        res.status(400);
        throw new Error('Please upload at least one image (front or back).');
    }

    // 3. Find Company
    const company = await Company.findOne({ submittedBy: req.user.id });
    if (!company) {
        res.status(404);
        throw new Error('Company not found.');
    }

    // 4. Check Approval (Must be APPROVED)
    if (company.status !== 'APPROVED') {
        res.status(403);
        throw new Error('Company must be approved to upload business cards.');
    }

    // 5. Update Company
    const updates = {};
    if (req.files.front) {
        updates['businessCard.frontImageUrl'] = `/uploads/business-cards/${req.files.front[0].filename}`;
    }
    if (req.files.back) {
        updates['businessCard.backImageUrl'] = `/uploads/business-cards/${req.files.back[0].filename}`;
    }
    updates['businessCard.uploadedAt'] = Date.now();

    const updatedCompany = await Company.findByIdAndUpdate(
        company._id,
        { $set: updates },
        { new: true }
    );

    await logActivity(req.user.id, 'BUSINESS_CARD_UPLOAD', `Uploaded business card for ${company.name}`);

    res.status(200).json(updatedCompany);
});

module.exports = {
  registerCompany,
  getCompanyById,
  searchCompanies,
  getSearchSuggestions,
  getTrendingCompanies,
  checkCompanyIdentity,
  uploadBusinessCard,
  uploadMiddleware
};
