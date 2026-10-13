const express = require("express");
const router = express.Router();
const {
  assignTeacher,
  getAssignments,
  getTeacherAssignments,
  removeAssignment,
  updateAssignment
} = require("../controllers/teacherAssignmentController");
const { protect, requireRole } = require("../middleware/authMiddleware");

router.post("/", protect, requireRole("principal"), assignTeacher);
router.get("/", protect, requireRole("principal", "teacher"), getAssignments);
router.get("/teacher/:teacherId", protect, getTeacherAssignments);
router.delete("/:id", protect, requireRole("principal"), removeAssignment);
router.put("/:id", protect, requireRole("principal"), updateAssignment);

module.exports = router;
