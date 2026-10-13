const express = require("express");
const router = express.Router();
const {
  getTeachers,
  createTeacher,
  getTeacherById,
  updateTeacher,
  updateTeacherStatus,
  deleteTeacher
} = require("../controllers/principalTeacherController");
const { protect, requireRole, requireMainPrincipal } = require("../middleware/authMiddleware");

// All routes are protected and require principal role
router.use(protect);
router.use(requireRole("principal"));

router.route("/")
  .get(getTeachers)
  .post(requireMainPrincipal, createTeacher);

router.route("/:id")
  .get(getTeacherById)
  .put(requireMainPrincipal, updateTeacher)
  .delete(requireMainPrincipal, deleteTeacher);

router.patch("/:id/status", requireMainPrincipal, updateTeacherStatus);

module.exports = router;
