const mongoose = require("mongoose");

const tuitionAttendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TuitionSession",
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
    markedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// One student must have ONLY ONE attendance record per batch per session per date
tuitionAttendanceSchema.index({ studentId: 1, batchId: 1, sessionId: 1, date: 1 }, { unique: true });

const TuitionAttendance = mongoose.model("TuitionAttendance", tuitionAttendanceSchema);

module.exports = TuitionAttendance;
