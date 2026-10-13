const mongoose = require("mongoose");

const handRaiseSchema = new mongoose.Schema(
  {
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    raisedByRole: {
      type: String,
      required: true,
      enum: ["student", "parent", "teacher", "principal"],
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetRole: {
      type: String,
      required: true,
      enum: ["teacher", "principal", "parent"],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    topic: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Doubt",
        "Inquiry",
        "Meeting Request",
        "Academic",
        "Attendance",
        "Behaviour",
        "Homework",
        "General",
        "Other",
      ],
    },
    message: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ["Normal", "High", "Urgent"],
      default: "Normal",
    },
    status: {
      type: String,
      enum: ["PENDING", "VIEWED", "SCHEDULED", "COMPLETED", "CANCELLED"],
      default: "PENDING",
    },
    responseMessage: {
      type: String,
    },
    responseBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    viewedAt: {
      type: Date,
    },
    scheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    scheduledDate: {
      type: Date,
    },
    scheduledTime: {
      type: String,
    },
    duration: {
      type: Number, // in minutes
    },
    meetingType: {
      type: String,
      enum: ["In Person", "Online"],
    },
    location: {
      type: String,
    },
    meetingLink: {
      type: String,
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
    },
  },
  { timestamps: true }
);

// Indexes
handRaiseSchema.index({ targetUser: 1, status: 1 });
handRaiseSchema.index({ raisedBy: 1 });
handRaiseSchema.index({ student: 1 });
handRaiseSchema.index({ createdAt: -1 });
handRaiseSchema.index({ scheduledDate: 1 });

const HandRaise = mongoose.model("HandRaise", handRaiseSchema);

module.exports = HandRaise;
