const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["present", "absent", "leave"],
      required: true,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    leaveRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveRequest",
    },
    session: {
      type: String,
      enum: ["MORNING", "AFTERNOON"],
      default: "MORNING",
    },
    markedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// One student must have ONLY ONE attendance record per class per date per session
attendanceSchema.index({ studentId: 1, classId: 1, date: 1, session: 1 }, { unique: true });
// Support teacher dashboard query by classId and date
attendanceSchema.index({ classId: 1, date: 1 });

const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;
