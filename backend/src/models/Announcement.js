const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['principal', 'teacher'],
    required: true,
  },
  targetAudience: [{
    type: String,
    enum: ['student', 'teacher', 'parent'],
  }],
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
  },
  isImportant: {
    type: Boolean,
    default: false,
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Announcement', announcementSchema);
