const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String, enum: ['pdf', 'ppt', 'doc', 'video', 'link'], default: 'link' },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fileUrl: { type: String },
  size: { type: String, default: 'Link' }
}, { timestamps: true });

module.exports = mongoose.model('Resource', resourceSchema);
