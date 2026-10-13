const mongoose = require("mongoose");

const tuitionSessionSchema = new mongoose.Schema(
  {
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dayOfWeek: {
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      required: false, // Useful if this is a weekly repeating schedule
    },
    sessionDate: {
      type: Date,
      required: false, // Useful for specific ad-hoc sessions
    },
    startTime: {
      type: String, // HH:MM format
      required: true,
    },
    endTime: {
      type: String, // HH:MM format
      required: true,
    },
    room: {
      type: String,
      required: false,
    },
    sessionType: {
      type: String,
      enum: ["recurring", "one-time"],
      default: "recurring",
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }
  },
  {
    timestamps: true,
  }
);

tuitionSessionSchema.index({ batchId: 1 });
tuitionSessionSchema.index({ teacherId: 1 });

const TuitionSession = mongoose.model("TuitionSession", tuitionSessionSchema);

module.exports = TuitionSession;
