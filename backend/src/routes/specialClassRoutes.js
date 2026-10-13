const express = require("express");
const router = express.Router();
const { protect, requireRole } = require("../middleware/authMiddleware");
const specialClassController = require("../controllers/specialClassController");

router.use(protect);

// Student Routes
router.get("/available", requireRole("student", "parent"), specialClassController.getAvailableClasses);
router.post("/:id/interested", requireRole("student", "parent"), specialClassController.submitInterest);
router.get("/my", requireRole("student", "parent"), specialClassController.getMyClasses);

// Shared/Teacher/Principal Routes (Read)
router.get("/", requireRole("principal", "teacher"), specialClassController.getAllClasses);
router.get("/analytics", requireRole("principal"), specialClassController.getAnalytics);
router.get("/:id", requireRole("principal", "teacher", "student", "parent"), specialClassController.getClassDetails);
router.get("/:id/enrollments", requireRole("principal", "teacher"), specialClassController.getEnrollments);
router.get("/:id/attendance", requireRole("principal", "teacher", "student", "parent"), specialClassController.getAttendance);
router.get("/:id/progress", requireRole("principal", "teacher"), specialClassController.getAllProgress);

// Teacher/Principal Actions
router.post("/:id/enrollments/:enrollmentId/approve", requireRole("principal", "teacher"), specialClassController.approveEnrollment);
router.post("/:id/enrollments/:enrollmentId/reject", requireRole("principal", "teacher"), specialClassController.rejectEnrollment);
router.post("/:id/attendance", requireRole("principal", "teacher"), specialClassController.markAttendance);
router.put("/:id/progress/:studentId", requireRole("principal", "teacher"), specialClassController.updateProgress);

// Principal Only Actions
router.post("/", requireRole("principal"), specialClassController.createClass);
router.put("/:id", requireRole("principal"), specialClassController.updateClass);
router.post("/:id/publish", requireRole("principal"), specialClassController.publishClass);
router.post("/:id/open-registration", requireRole("principal"), specialClassController.openRegistration);
router.post("/:id/close-registration", requireRole("principal"), specialClassController.closeRegistration);
router.post("/:id/start", requireRole("principal"), specialClassController.startClass);
router.post("/:id/complete", requireRole("principal"), specialClassController.completeClass);

module.exports = router;
