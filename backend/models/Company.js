const mongoose = require('mongoose');

const companySchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a company name'],
    trim: true,
    index: true
  },
  gst: {
    type: String,
    required: [true, 'Please add GST number'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 15,
    maxlength: 15
  },
  pan: {
    type: String,
    required: [true, 'Please add PAN number'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 10,
    maxlength: 10
  },
  city: {
    type: String,
    required: [true, 'Please add city']
  },
  businessType: {
    type: String, 
    required: [true, 'Please add business type'],
    enum: [
      'Manufacturer',
      'Trader',
      'Wholesaler',
      'Retailer',
      'Yarn Supplier',
      'Fabric Manufacturer',
      'Dyeing Unit',
      'Printing Unit',
      'Exporter'
    ]
  },
  contactPerson: {
    type: String
  },
  officialEmail: {
    type: String
  },
  officialPhone: {
    type: String
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  businessCard: {
    frontImageUrl: String,
    backImageUrl: String,
    uploadedAt: Date
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  avgRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  dealAgainPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  viewsCount: {
    type: Number,
    default: 0
  },
  trustStatus: {
    type: String,
    enum: ['TRUSTED', 'CAUTION', 'LOW_TRUST', 'UNRATED'],
    default: 'UNRATED'
  },
  gstDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  isGstVerified: {
    type: Boolean,
    default: false
  },
  lastReviewAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Company', companySchema);
