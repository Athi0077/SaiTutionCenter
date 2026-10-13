const express = require("express");
const router = express.Router();
const {
  createProject,
  getTeacherProjects,
  getStudentProjects,
  getProjectById,
  submitProject,
  getTeacherApprovals,
  reviewSubmission,
  getStudentHistory
} = require("../controllers/projectController");
const { protect, requireRole } = require("../middleware/authMiddleware");

// Teacher routes
router.post("/", protect, requireRole("teacher"), createProject);
router.get("/teacher", protect, requireRole("teacher"), getTeacherProjects);
router.get("/submissions/approvals", protect, requireRole("teacher"), getTeacherApprovals);
router.patch("/submissions/:id/review", protect, requireRole("teacher"), reviewSubmission);

const { upload } = require("../middleware/uploadMiddleware");

// Student routes
router.get("/student", protect, requireRole("student"), getStudentProjects);
router.get("/student/history", protect, requireRole("student"), getStudentHistory);
router.post("/:id/submit", protect, requireRole("student"), upload.single("file"), submitProject);

// Shared
router.get("/:id", protect, getProjectById);

module.exports = router;
