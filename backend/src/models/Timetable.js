const mongoose = require("mongoose");

const periodSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  },
  periodNumber: {
    type: Number,
    required: true
  },
  startTime: {
    type: String, // HH:MM format
    required: true
  },
  endTime: {
    type: String, // HH:MM format
    required: true
  },
  subject: {
    type: String,
    required: false
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: false
  },
  subjectTeacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false
  },
  type: {
    type: String,
    enum: ["regular", "break", "lunch"],
    default: "regular"
  }
});

const timetableSchema = new mongoose.Schema(
  {
    academicYearId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true
    },
    classTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    workingDays: [{
      type: String,
      enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    }],
    periods: [periodSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Ensure only one timetable exists per class per academic year
timetableSchema.index({ classId: 1, academicYearId: 1 }, { unique: true });

const Timetable = mongoose.model("Timetable", timetableSchema);

module.exports = Timetable;
