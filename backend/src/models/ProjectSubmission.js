const mongoose = require("mongoose");

const projectSubmissionSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
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
    answerText: {
      type: String,
    },
    attachments: [
      {
        fileName: String,
        fileType: String,
        url: String,
        publicId: String,
      },
    ],
    status: {
      type: String,
      enum: ["pending_approval", "approved", "revision_required"],
      default: "pending_approval",
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

const ProjectSubmission = mongoose.model("ProjectSubmission", projectSubmissionSchema);

module.exports = ProjectSubmission;
