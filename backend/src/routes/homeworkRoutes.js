const express = require("express");
const router = express.Router();
const {
  createHomework,
  getTeacherHomework,
  getStudentHomework,
  getHomeworkById,
  getAdminOverview,
  updateHomework,
  deleteHomework,
} = require("../controllers/homeworkController");

const { submitHomework, getHomeworkSubmissions } = require("../controllers/submissionController");

const { protect, requireRole } = require("../middleware/authMiddleware");

// Student History is handled in submission routes or here? We can put it in submissionRoutes.

router.post("/", protect, requireRole("teacher"), createHomework);
router.get("/teacher", protect, requireRole("teacher"), getTeacherHomework);
router.get("/student", protect, requireRole("student"), getStudentHomework);
router.get("/admin-overview", protect, requireRole("principal"), getAdminOverview);
router.get("/:id", protect, getHomeworkById);
router.put("/:id", protect, requireRole("teacher"), updateHomework);
router.delete("/:id", protect, requireRole("teacher", "principal"), deleteHomework);

const { upload } = require("../middleware/uploadMiddleware");

// Submissions for specific homework
router.post("/:homeworkId/submit", protect, requireRole("student"), upload.single("file"), submitHomework);
router.get("/:homeworkId/submissions", protect, requireRole("teacher"), getHomeworkSubmissions);

module.exports = router;
