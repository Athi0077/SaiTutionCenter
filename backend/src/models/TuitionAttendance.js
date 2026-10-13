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
      ref: "Class",
      required: false,
      default: null,
    },
    standardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Standard",
      required: false,
      default: null,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TuitionSession",
      required: false,
      default: null,
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

tuitionAttendanceSchema.index({ studentId: 1, date: 1, sessionId: 1 });
tuitionAttendanceSchema.index({ date: 1 });

const TuitionAttendance = mongoose.model("TuitionAttendance", tuitionAttendanceSchema);

module.exports = TuitionAttendance;
