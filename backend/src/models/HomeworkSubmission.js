const mongoose = require("mongoose");

const homeworkSubmissionSchema = new mongoose.Schema(
  {
    homeworkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Homework",
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
    submittedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["pending_approval", "approved", "revision_required"],
      default: "pending_approval",
    },
    marks: {
      type: Number,
    },
    maxMarks: {
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

homeworkSubmissionSchema.index({ studentId: 1, homeworkId: 1 });
homeworkSubmissionSchema.index({ homeworkId: 1, status: 1 });

const HomeworkSubmission = mongoose.model("HomeworkSubmission", homeworkSubmissionSchema);

module.exports = HomeworkSubmission;
