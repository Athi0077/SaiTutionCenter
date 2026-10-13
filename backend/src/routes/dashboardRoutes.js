const express = require("express");
const router = express.Router();
const { getPrincipalDashboard, getTeacherDashboard, getStudentDashboard, getParentDashboard, getStudentAnalytics } = require("../controllers/dashboardController");
const { protect, requireRole } = require("../middleware/authMiddleware");

router.get("/dashboard/principal", protect, requireRole("principal"), getPrincipalDashboard);
router.get("/dashboard/teacher", protect, requireRole("teacher"), getTeacherDashboard);
router.get("/dashboard/student", protect, requireRole("student"), getStudentDashboard);
router.get("/dashboard/student/analytics", protect, requireRole("student"), getStudentAnalytics);
router.get("/dashboard/parent", protect, requireRole("parent"), getParentDashboard);

module.exports = router;
