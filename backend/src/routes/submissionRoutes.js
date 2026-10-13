const express = require("express");
const router = express.Router();
const {
  submitHomework,
  getHomeworkSubmissions,
  reviewSubmission,
  getStudentHistory,
  getSubmissionById,
  getTeacherApprovals,
} = require("../controllers/submissionController");
const { protect, requireRole } = require("../middleware/authMiddleware");

router.get("/approvals", protect, requireRole("teacher"), getTeacherApprovals);
router.get("/history", protect, requireRole("student"), getStudentHistory);
router.get("/:submissionId", protect, getSubmissionById);
router.patch("/:submissionId/review", protect, requireRole("teacher"), reviewSubmission);

module.exports = router;
