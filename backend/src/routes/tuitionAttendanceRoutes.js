const express = require("express");
const router = express.Router();
const { markAttendance, getAttendance } = require("../controllers/tuitionAttendanceController");
const { protect, requireRole } = require("../middleware/authMiddleware");

// Allowed roles for managing attendance
const allowManage = requireRole("principal", "teacher");

router.post("/", protect, allowManage, markAttendance);
router.get("/", protect, getAttendance);

module.exports = router;
