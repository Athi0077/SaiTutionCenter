const express = require("express");
const router = express.Router();
const { getStudentDetailsForPrincipal } = require("../controllers/principalStudentController");
const { protect, requireRole } = require("../middleware/authMiddleware");

// All routes require protection and Principal or Teacher role
router.use(protect);
router.use(requireRole("principal", "teacher"));

// @route   GET /api/principal/students/details/:studentId
// @route   GET /api/teacher/students/details/:studentId
// @access  Private (Principal & Teacher)
router.get("/details/:studentId", getStudentDetailsForPrincipal);
router.get("/:studentId/details", getStudentDetailsForPrincipal);
router.get("/:studentId", getStudentDetailsForPrincipal);

module.exports = router;
