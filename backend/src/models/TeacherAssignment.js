const mongoose = require("mongoose");

const teacherAssignmentSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
    },
    isClassTeacher: {
      type: Boolean,
      default: false,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate assignment of the same teacher to the exact same standard/section
teacherAssignmentSchema.index({ teacherId: 1, standardId: 1, sectionId: 1 }, { unique: true });

const TeacherAssignment = mongoose.model("TeacherAssignment", teacherAssignmentSchema);

module.exports = TeacherAssignment;
