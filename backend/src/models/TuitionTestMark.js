const mongoose = require("mongoose");

const tuitionTestMarkSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TuitionTest",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    marksObtained: {
      type: Number,
      required: true,
    },
    remarks: {
      type: String,
    },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

tuitionTestMarkSchema.index({ testId: 1, studentId: 1 }, { unique: true });

const TuitionTestMark = mongoose.model("TuitionTestMark", tuitionTestMarkSchema);

module.exports = TuitionTestMark;
