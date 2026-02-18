const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  rating: {
    type: Number,
    required: [true, 'Please add a rating between 1 and 5'],
    min: 1,
    max: 5
  },
  wouldDealAgain: {
    type: Boolean,
    required: true
  },
  comment: {
    type: String,
    maxLength: 500
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  reportCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  collection: 'reviews'
});

// Prevent user from reviewing the same company twice
reviewSchema.index({ userId: 1, companyId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
