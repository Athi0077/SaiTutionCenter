const mongoose = require('mongoose');

const schoolCalendarSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: [
      'GENERAL_HOLIDAY',
      'GOVERNMENT_HOLIDAY',
      'SCHOOL_HOLIDAY',
      'SPECIAL_HOLIDAY',
      'EMERGENCY_HOLIDAY'
    ],
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  announcementMessage: {
    type: String,
    default: ''
  },
  isHoliday: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('SchoolCalendar', schoolCalendarSchema);
