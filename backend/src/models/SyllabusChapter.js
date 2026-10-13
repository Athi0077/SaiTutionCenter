const mongoose = require('mongoose');

const syllabusChapterSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  subject: { type: String, required: true },
  academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  chapterNumber: { type: Number, required: true },
  chapterTitle: { type: String, required: true },
  description: { type: String },
  learningObjectives: { type: String },
  estimatedCompletionDate: { type: Date },
  referenceMaterials: { type: String },
  status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
  completedAt: { type: Date },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// Ensure unique chapter numbers within the same class, subject, and academic year
syllabusChapterSchema.index({ classId: 1, subject: 1, academicYearId: 1, chapterNumber: 1 }, { unique: true });

module.exports = mongoose.model('SyllabusChapter', syllabusChapterSchema);
