const mongoose = require("mongoose");

const feeStatusSchema = new mongoose.Schema(
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
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: false,
    },
    term: {
      type: String,
      default: "current",
    },
    feePeriod: {
      type: String,
      enum: ["Monthly", "Yearly"],
      default: "Monthly",
    },
    feeStatus: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    lastBilledMonth: {
      type: String,
    },
    lastBilledYear: {
      type: Number,
    },
    lastResetDate: {
      type: Date,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    statusUpdatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one fee status record per student per class per term
feeStatusSchema.index(
  { studentId: 1, classId: 1, term: 1, academicYearId: 1 },
  { unique: true }
);

const FeeStatus = mongoose.model("FeeStatus", feeStatusSchema);

module.exports = FeeStatus;
