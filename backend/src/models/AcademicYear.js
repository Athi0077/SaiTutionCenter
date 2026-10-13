const mongoose = require("mongoose");

const academicYearSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "2026-2027"
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ["upcoming", "active", "completed", "archived"], default: "upcoming" },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
}, { timestamps: true });

// Ensure only one active academic year per school (can't use unique index directly on enum without partial filter, handled in logic)

const AcademicYear = mongoose.model("AcademicYear", academicYearSchema);

module.exports = AcademicYear;
