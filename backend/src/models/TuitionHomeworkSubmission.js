const mongoose = require("mongoose");

const tuitionHomeworkSubmissionSchema = new mongoose.Schema(
  {
    homeworkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TuitionHomework",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "submitted", "graded"],
      default: "pending",
    },
    studentNote: {
      type: String,
    },
    teacherRemarks: {
      type: String,
    },
    grade: {
      type: String,
    },
    submittedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

tuitionHomeworkSubmissionSchema.index({ homeworkId: 1, studentId: 1 }, { unique: true });

const TuitionHomeworkSubmission = mongoose.model("TuitionHomeworkSubmission", tuitionHomeworkSubmissionSchema);

module.exports = TuitionHomeworkSubmission;
