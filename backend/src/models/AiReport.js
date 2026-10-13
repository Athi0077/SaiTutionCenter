const mongoose = require("mongoose");

const aiReportSchema = new mongoose.Schema(
  {
    principalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportType: {
      type: String,
      enum: ["Individual Academic", "Personalized Improvement Plan"],
      default: "Individual Academic",
    },
    academicPeriod: {
      type: String,
      default: "Current Term",
    },
    verifiedMetrics: {
      type: mongoose.Schema.Types.Mixed, // Snapshot of actual data
    },
    aiInsights: {
      type: String, // Store summary or improvement plan text
    },
    approved: {
      type: Boolean,
      default: false,
    },
    approvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AiReport", aiReportSchema);
