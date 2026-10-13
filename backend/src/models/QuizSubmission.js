const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    selectedAnswer: {
      type: String,
      default: "",
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    marksObtained: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { _id: false }
);

const quizSubmissionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    answers: [answerSchema],
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    totalMarks: {
      type: Number,
      required: true,
      default: 0,
    },
    percentage: {
      type: Number,
      required: true,
      default: 0,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    timeTaken: {
      type: Number,
      default: 0, // In seconds
    },
  },
  {
    timestamps: true,
  }
);

// Enforce one student -> one submission per activity
quizSubmissionSchema.index({ quizId: 1, studentId: 1 }, { unique: true });

const QuizSubmission = mongoose.model("QuizSubmission", quizSubmissionSchema);

module.exports = QuizSubmission;
