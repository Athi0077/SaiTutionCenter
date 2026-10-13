const mongoose = require("mongoose");

const substituteAssignmentSchema = new mongoose.Schema(
  {
    originalTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    substituteTeacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    timetableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Timetable",
      required: true,
    },
    date: {
      type: String, // format: YYYY-MM-DD to ensure exact date matches
      required: true,
    },
    periodNumber: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      default: "STAFF_LEAVE",
    },
    status: {
      type: String,
      enum: ["ASSIGNED", "COMPLETED", "CANCELLED"],
      default: "ASSIGNED",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Ensure no duplicate assignments for the same timetable period on the same date unless cancelled
substituteAssignmentSchema.index({ timetableId: 1, date: 1, status: 1 });
substituteAssignmentSchema.index({ originalTeacherId: 1, date: 1 });
substituteAssignmentSchema.index({ substituteTeacherId: 1, date: 1 });

const SubstituteAssignment = mongoose.model("SubstituteAssignment", substituteAssignmentSchema);
module.exports = SubstituteAssignment;
