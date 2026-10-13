const mongoose = require("mongoose");

const testSubmissionSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
    },
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
    submittedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["pending_approval", "approved", "revision_required", "submitted", "graded"],
      default: "submitted",
    },
    marks: {
      type: Number,
    },
    feedback: {
      type: String,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const TestSubmission = mongoose.model("TestSubmission", testSubmissionSchema);

module.exports = TestSubmission;
