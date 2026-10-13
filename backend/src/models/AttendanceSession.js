const mongoose = require("mongoose");

const attendanceSessionSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    attendanceDate: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    session: {
      type: String,
      enum: ["DAILY", "MORNING", "AFTERNOON"],
      default: "DAILY",
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    records: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        status: {
          type: String,
          enum: ["present", "absent", "leave", "late"], // Matching existing statuses + late if used
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Enforce unique record per class per date per session
attendanceSessionSchema.index({ classId: 1, attendanceDate: 1, session: 1 }, { unique: true });
// Support principal dashboard query by date and session without classId
attendanceSessionSchema.index({ attendanceDate: 1, session: 1 });

const AttendanceSession = mongoose.model("AttendanceSession", attendanceSessionSchema);

module.exports = AttendanceSession;
