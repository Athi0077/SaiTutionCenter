const mongoose = require("mongoose");

const homeworkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
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
    dueDate: {
      type: Date,
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal",
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
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

homeworkSchema.index({ classId: 1, status: 1 });
homeworkSchema.index({ teacherId: 1 });

const Homework = mongoose.model("Homework", homeworkSchema);

module.exports = Homework;
