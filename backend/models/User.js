const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Please add a company name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    sparse: true, // Allows null/undefined if we ever supported that, but mainly helps with uniqueness
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  contactNumber: {
    type: String,
    required: [true, 'Please add a contact number'],
    unique: true
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
  },
  role: {
    type: String,
    enum: [
      'TRADER', 
      'MANUFACTURER', 
      'WHOLESALER',
      'RETAILER',
      'YARN_SUPPLIER',
      'FABRIC_MANUFACTURER',
      'DYEING_UNIT',
      'PRINTING_UNIT',
      'EXPORTER',
      'ADMIN'
    ],
    required: [true, 'Please specify a role'],
    default: 'TRADER'
  },
  isSubscribed: {
    type: Boolean,
    default: false
  },
  subscription: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription'
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE']
    },
    activatedAt: {
      type: Date
    }
  },
  ownedCompanyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  companySnapshot: {
    companyName: String,
    gstNumber: String,
    panNumber: String,
    city: String,
    businessType: String,
    contactPerson: String,
    contactNumber: String,
    email: String
  },
  profilePhoto: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Encrypt password using bcrypt
// Encrypt password using bcrypt
userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
