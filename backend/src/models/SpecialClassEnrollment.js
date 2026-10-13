const mongoose = require("mongoose");

const specialClassEnrollmentSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: ["Interested", "Pending", "Enrolled", "Rejected", "Waitlisted"],
      default: "Interested"
    },
    requestedAt: {
      type: Date,
      default: Date.now
    },
    approvedAt: {
      type: Date
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    rejectedAt: {
      type: Date
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    enrolledAt: {
      type: Date
    },
    waitlistPosition: {
      type: Number
    }
  },
  {
    timestamps: true
  }
);

// Enforce unique enrollment per student per class
specialClassEnrollmentSchema.index({ specialClassId: 1, studentId: 1 }, { unique: true });
specialClassEnrollmentSchema.index({ specialClassId: 1, status: 1 });

const SpecialClassEnrollment = mongoose.model("SpecialClassEnrollment", specialClassEnrollmentSchema);

module.exports = SpecialClassEnrollment;
