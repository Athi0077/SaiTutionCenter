const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Completed"],
    default: "Pending"
  },
  completedAt: {
    type: Date
  },
  completionRemarks: {
    type: String
  },
  submissionAttachment: {
    type: String
  }
}, { timestamps: true });

const todoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  taskType: {
    type: String,
    enum: ["PRINCIPAL_TO_TEACHER", "TEACHER_TO_STUDENT", "STUDENT_PERSONAL"],
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Medium"
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class"
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject"
  },
  attachment: {
    type: String // Optional attachment link uploaded by creator
  },
  assignments: [assignmentSchema] // Empty for STUDENT_PERSONAL
}, {
  timestamps: true
});

// Helper virtual to check if overdue
todoSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate) return false;
  return Date.now() > this.dueDate.getTime();
});

todoSchema.set('toJSON', { virtuals: true });
todoSchema.set('toObject', { virtuals: true });

const Todo = mongoose.model("Todo", todoSchema);

module.exports = Todo;
