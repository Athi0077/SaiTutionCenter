const mongoose = require("mongoose");

const aiInterventionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    principalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    academicYear: {
      type: String,
      default: "Current",
    },
    subjects: [String],
    concern: {
      type: String,
      required: true,
    },
    baselineMetrics: {
      type: mongoose.Schema.Types.Mixed, // stores subject marks, attendance at the time of creation
    },
    improvementTarget: {
      type: String,
      required: true,
    },
    actionItems: [
      {
        item: String,
        completed: { type: Boolean, default: false },
        completedAt: Date,
      }
    ],
    status: {
      type: String,
      enum: ["Planned", "In Progress", "Completed", "On Hold"],
      default: "Planned",
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    reviewDate: {
      type: Date,
    },
    reviews: [
      {
        date: { type: Date, default: Date.now },
        aiSummary: String,
        principalNotes: String,
        snapshotMetrics: mongoose.Schema.Types.Mixed,
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("AiIntervention", aiInterventionSchema);
