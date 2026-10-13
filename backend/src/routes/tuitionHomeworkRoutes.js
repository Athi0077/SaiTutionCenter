const express = require("express");
const router = express.Router();
const { 
  createHomework, 
  getHomework, 
  submitHomework, 
  gradeHomework, 
  getSubmissions, 
  getMySubmissions 
} = require("../controllers/tuitionHomeworkController");
const { protect, requireRole } = require("../middleware/authMiddleware");

const allowManage = requireRole("principal", "teacher");

router.post("/", protect, allowManage, createHomework);
router.get("/", protect, getHomework);

// Student submissions
router.get("/my-submissions", protect, requireRole("student"), getMySubmissions);
router.post("/:id/submit", protect, requireRole("student"), submitHomework);

// Teacher manage submissions
router.get("/:id/submissions", protect, allowManage, getSubmissions);
router.post("/submissions/:submissionId/grade", protect, allowManage, gradeHomework);

module.exports = router;
