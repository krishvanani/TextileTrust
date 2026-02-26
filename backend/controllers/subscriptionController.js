const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Company = require('../models/Company');
const { logActivity } = require('./activityController');

// @desc    Activate subscription
// @route   POST /api/subscription/activate
// @access  Private
const activateSubscription = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Fetch User First (Single Source of Truth)
    const user = await User.findById(userId);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // 2. IDEMPOTENCY CHECK
    // If already subscribed, return immediately. Do not create duplicate.
    if (user.isSubscribed) {
        console.log(`ACTIVATE: User ${userId} already subscribed. Skipping write.`);
        // Get company for complete response
        const company = await Company.findOne({ submittedBy: user._id });
        
        return res.status(200).json({
            success: true,
            data: {
                _id: user._id,
                companyName: user.companyName,
                email: user.email,
                role: user.role,
                contactNumber: user.contactNumber,
                isSubscribed: user.isSubscribed,
                subscription: user.subscription, // Return nested object
                ownedCompanyId: user.ownedCompanyId,
                registeredCompanyId: company ? company._id : null
            }
        });
    }

    // 3. Create Subscription
    console.log('[PERSISTENCE] Saving subscription to MongoDB...');
    let subscription;
    try {
        subscription = await Subscription.create({
            userId,
            status: 'ACTIVE',
            companySnapshot: req.body // Save snapshot if provided
        });
        console.log(`[PERSISTENCE] Subscription saved: ${subscription._id}`);
    } catch (saveError) {
        console.error('[PERSISTENCE] Subscription Save Failed:', saveError);
        console.error('Snapshot Data:', JSON.stringify(req.body));
        throw saveError;
    }

    // 4. Update User
    user.isSubscribed = true;
    user.subscription = {
        id: subscription._id,
        status: 'ACTIVE',
        activatedAt: new Date()
    };

    // Update companyName and role from subscription form data
    if (req.body.companyName) {
      user.companyName = req.body.companyName;
    }
    if (req.body.businessType) {
      // Convert display format (e.g. "Yarn Supplier") to enum format (e.g. "YARN_SUPPLIER")
      const roleValue = req.body.businessType.toUpperCase().replace(/\s+/g, '_');
      user.role = roleValue;
    }
    
    // 5. Save User (Persistence)
    const savedUser = await user.save();
    console.log(`[PERSISTENCE] User updated with subscription status: ${savedUser.isSubscribed}`);

    // Log Activity
    await logActivity(userId, 'SUBSCRIPTION', 'Premium subscription activated.');

    // 6. Get Company details
    const company = await Company.findOne({ submittedBy: user._id });

    // 7. Return FINAL updated user object
    res.status(200).json({
        success: true,
        data: {
        _id: user._id,
        companyName: user.companyName,
        email: user.email,
        role: user.role,
        contactNumber: user.contactNumber,
        isSubscribed: user.isSubscribed,
        subscription: user.subscription,
        ownedCompanyId: user.ownedCompanyId,
        registeredCompanyId: company ? company._id : null
        }
    });

  } catch (error) {
    console.error('ACTIVATE SUBSCRIPTION ERROR:', error);
    res.status(500);
    throw error;
  }
});

// @desc    Get current user subscription (for autofill)
// @route   GET /api/subscription/my
// @access  Private
const getMySubscription = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const subscription = await Subscription.findOne({ 
        userId, 
        status: 'ACTIVE' 
    });

    if (!subscription) {
        res.status(404);
        throw new Error('No active subscription found');
    }

    res.status(200).json({
        success: true,
        data: subscription // This includes companySnapshot
    });
});

module.exports = {
  activateSubscription,
  getMySubscription
};
