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

// Prevent duplicate assignment of the same teacher to the same standard + subject
teacherAssignmentSchema.index({ teacherId: 1, standardId: 1, subjectId: 1 }, { unique: true, sparse: true });

const TeacherAssignment = mongoose.model("TeacherAssignment", teacherAssignmentSchema);

module.exports = TeacherAssignment;
