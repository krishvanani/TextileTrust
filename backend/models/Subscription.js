const mongoose = require('mongoose');

const subscriptionSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  companySnapshot: {
    type: mongoose.Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE'
  }
}, {
  timestamps: true,
  collection: 'subscriptions'
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
