const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  status: { type: String, enum: ["active", "promoted", "graduated", "transferred", "withdrawn", "repeating"], default: "active" },
  type: { type: String, enum: ["new_admission", "promoted", "re_enrolled", "repeating"], default: "new_admission" },
  rollNumber: { type: String },
  previousEnrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment' },
  promotionDate: { type: Date }
}, { timestamps: true });

// Prevent multiple enrollments in the same academic year
enrollmentSchema.index({ studentId: 1, academicYearId: 1 }, { unique: true });

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

module.exports = Enrollment;
