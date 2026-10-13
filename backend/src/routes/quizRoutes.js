const express = require("express");
const router = express.Router();
const quizController = require("../controllers/quizController");
const { protect, requireRole } = require("../middleware/authMiddleware");

// Teacher Assignments for Quiz Creation Cascading Dropdowns
router.get(
  "/teacher-assignments",
  protect,
  requireRole("teacher"),
  quizController.getTeacherAssignments
);

// Quizzes Creation & Lists
router.post(
  "/quizzes",
  protect,
  requireRole("teacher"),
  quizController.createQuiz
);

router.get(
  "/quizzes/teacher",
  protect,
  requireRole("teacher"),
  quizController.getTeacherQuizzes
);

router.get(
  "/quizzes/student",
  protect,
  requireRole("student", "parent"),
  quizController.getStudentQuizzes
);

router.get(
  "/principal/overview",
  protect,
  requireRole("principal", "main_principal"),
  quizController.getPrincipalOverview
);

router.get(
  "/quizzes/:id",
  protect,
  quizController.getQuizById
);

router.post(
  "/quizzes/:id/submit",
  protect,
  requireRole("student"),
  quizController.submitQuiz
);

router.get(
  "/quizzes/:id/results",
  protect,
  requireRole("teacher", "principal", "main_principal"),
  quizController.getQuizResults
);

router.delete(
  "/quizzes/:id",
  protect,
  requireRole("teacher", "principal", "main_principal"),
  quizController.deleteQuiz
);

module.exports = router;
