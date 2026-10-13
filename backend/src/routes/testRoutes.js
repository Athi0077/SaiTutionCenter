const express = require("express");
const router = express.Router();
const {
  createTest,
  getTeacherTests,
  getStudentTests,
  getTestById,
  submitTest,
  getTeacherApprovals,
  reviewSubmission,
  getStudentHistory,
  updateTest,
  deleteTest
} = require("../controllers/testController");
const { protect, requireRole } = require("../middleware/authMiddleware");

// Teacher routes
router.post("/", protect, requireRole("teacher"), createTest);
router.get("/teacher", protect, requireRole("teacher"), getTeacherTests);
router.get("/submissions/approvals", protect, requireRole("teacher"), getTeacherApprovals);
router.patch("/submissions/:id/review", protect, requireRole("teacher"), reviewSubmission);
router.put("/:id", protect, requireRole("teacher"), updateTest);
router.delete("/:id", protect, requireRole("teacher"), deleteTest);

// Student routes
router.get("/student", protect, requireRole("student"), getStudentTests);
router.get("/student/history", protect, requireRole("student"), getStudentHistory);
router.post("/:id/submit", protect, requireRole("student"), submitTest);

// Shared
router.get("/:id", protect, getTestById);

module.exports = router;
