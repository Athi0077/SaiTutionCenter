const mongoose = require("mongoose");

const examMarkSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    marksObtained: {
      type: Number,
      min: 0,
    },
    isAbsent: {
      type: Boolean,
      default: false,
    },
    remarks: {
      type: String,
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "published"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  }
);

// A student can only have one mark entry per exam per subject
examMarkSchema.index({ examId: 1, subjectId: 1, studentId: 1 }, { unique: true });

const ExamMark = mongoose.model("ExamMark", examMarkSchema);

module.exports = ExamMark;
