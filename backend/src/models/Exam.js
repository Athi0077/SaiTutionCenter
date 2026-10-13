const mongoose = require("mongoose");

const examScheduleSchema = new mongoose.Schema({
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  examDate: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String, // e.g. "09:30 AM"
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  maxMarks: {
    type: Number,
    required: true,
    min: 1,
  },
  passingMarks: {
    type: Number,
  },
  room: {
    type: String,
  },
  instructions: {
    type: String,
  },
});

const examSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: false,
    },
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },
    examName: {
      type: String,
      required: true,
    },
    examType: {
      type: String, // e.g. "Quarterly", "Annual", "Unit Test"
      required: true,
    },
    instructions: {
      type: String,
    },
    status: {
      type: String,
      enum: ["draft", "published", "completed", "cancelled"],
      default: "draft",
    },
    schedule: [examScheduleSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Exam = mongoose.model("Exam", examSchema);

module.exports = Exam;
