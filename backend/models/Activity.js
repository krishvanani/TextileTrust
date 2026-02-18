const mongoose = require('mongoose');

const activitySchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['REVIEW', 'COMPANY_REGISTERED', 'SUBSCRIPTION', 'ALERT', 'INFO', 'COMPANY_VIEWED'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company' // Dynamic ref potential, but usually Company for now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Activity', activitySchema);
