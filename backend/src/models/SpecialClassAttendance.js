const mongoose = require("mongoose");

const specialClassAttendanceSchema = new mongoose.Schema(
  {
    specialClassId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SpecialClass",
      required: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    date: {
      type: String, // YYYY-MM-DD format
      required: true
    },
    status: {
      type: String,
      enum: ["Present", "Absent"],
      required: true
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

specialClassAttendanceSchema.index({ specialClassId: 1, studentId: 1, date: 1 }, { unique: true });

const SpecialClassAttendance = mongoose.model("SpecialClassAttendance", specialClassAttendanceSchema);

module.exports = SpecialClassAttendance;
