const mongoose = require("mongoose");

const optionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const itemSchema = new mongoose.Schema({
  // MCQ / Maths / Puzzle / Image Challenge fields
  question: { type: String, trim: true },
  options: [optionSchema],
  correctAnswer: { type: String, trim: true },
  imageUrl: { type: String, default: "" },

  // Word Scramble fields
  word: { type: String, trim: true },
  hint: { type: String, default: "", trim: true },

  // True / False fields
  statement: { type: String, trim: true },
  isTrue: { type: Boolean },

  // Fill in the Blanks fields
  blankQuestion: { type: String, trim: true },
  blankAnswer: { type: String, trim: true },

  // Match the Pair fields
  leftItem: { type: String, trim: true },
  rightItem: { type: String, trim: true },

  marks: { type: Number, required: true, default: 1, min: 1 },
});

const quizSchema = new mongoose.Schema(
  {
    activityType: {
      type: String,
      enum: [
        "quiz",
        "maths_challenge",
        "word_scramble",
        "image_challenge",
        "puzzle",
        "true_false",
        "fill_blank",
        "match_pair",
      ],
      default: "quiz",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    standardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Standard",
      required: true,
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    questions: [itemSchema],
    totalMarks: {
      type: Number,
      required: true,
      default: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    timeLimit: {
      type: Number,
      default: 0, // In minutes (0 = no limit)
    },
    status: {
      type: String,
      enum: ["active", "closed", "draft"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

quizSchema.index({ standardId: 1, sectionId: 1, status: 1 });
quizSchema.index({ createdBy: 1, activityType: 1 });

const Quiz = mongoose.model("Quiz", quizSchema);

module.exports = Quiz;
