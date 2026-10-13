const mongoose = require("mongoose");

const tuitionHomeworkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TuitionSession", // optional, can link homework to a specific class session
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  }
);

tuitionHomeworkSchema.index({ batchId: 1, status: 1 });
tuitionHomeworkSchema.index({ teacherId: 1 });

const TuitionHomework = mongoose.model("TuitionHomework", tuitionHomeworkSchema);

module.exports = TuitionHomework;
