const mongoose = require("mongoose");

const teacherAttendanceSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["present", "absent", "leave"],
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

teacherAttendanceSchema.index({ teacherId: 1, date: 1 }, { unique: true });
teacherAttendanceSchema.index({ date: 1, status: 1 });

const TeacherAttendance = mongoose.model("TeacherAttendance", teacherAttendanceSchema);

module.exports = TeacherAttendance;
