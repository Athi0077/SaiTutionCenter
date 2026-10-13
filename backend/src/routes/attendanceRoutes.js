const express = require("express");
const router = express.Router();
const {
  saveAttendance,
  saveSessionAttendance,
  getSessionAttendance,
  getClassAttendance,
  getStudentAttendance,
  updateAttendance,
  getOverview,
  getTotalAttendanceReport,
  markTeacherAttendance,
  getTeacherTodayAttendance,
  getAllTeachersTodayAttendance,
  getTeacherAttendanceHistory,
} = require("../controllers/attendanceController");
const { protect, requireRole } = require("../middleware/authMiddleware");

// Teacher Self Attendance
router.post("/teacher/mark", protect, requireRole("teacher"), markTeacherAttendance);
router.get("/teacher/today", protect, requireRole("teacher"), getTeacherTodayAttendance);
router.get("/teacher/all", protect, requireRole("principal"), getAllTeachersTodayAttendance);
router.get("/teacher/:id/history", protect, requireRole("principal"), getTeacherAttendanceHistory);

router.post("/session", protect, requireRole("teacher"), saveSessionAttendance);
router.get("/session/:classId", protect, getSessionAttendance);

router.post("/", protect, requireRole("teacher"), saveAttendance);
router.get("/class/:classId", protect, getClassAttendance);
router.get("/my", protect, requireRole("student"), getStudentAttendance);
router.patch("/:attendanceId", protect, requireRole("teacher"), updateAttendance);
router.get("/overview", protect, requireRole("principal"), getOverview);
router.get("/report/total", protect, requireRole("principal"), getTotalAttendanceReport);

module.exports = router;
