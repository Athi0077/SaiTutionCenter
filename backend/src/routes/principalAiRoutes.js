const express = require("express");
const router = express.Router();
const {
  getOverview,
  getStudents,
  getStudentDetails,
  analyzeStudent
} = require("../controllers/principalAiController");
const { protect, requireRole } = require("../middleware/authMiddleware");

const {
  getClassAnalytics,
  getClassSubjects,
  getEarlyWarnings,
  generateClassSummary,
  compareClasses
} = require("../controllers/principalAiClassController");

const {
  getConversations,
  createConversation,
  getConversation,
  deleteConversation,
  clearMessages,
  handleChat
} = require("../controllers/principalAiChatController");

const {
  getReportStudents,
  getStudentReportData,
  generateReportSummary,
  generateImprovementPlan,
  approveReport,
  getReport
} = require("../controllers/principalAiReportController");

const {
  getDashboard,
  createIntervention,
  getIntervention,
  updateIntervention,
  generateReview
} = require("../controllers/principalAiProgressController");

// All routes require authentication and principal role
router.use(protect);
router.use(requireRole("principal"));

// Phase 1 Routes
router.get("/overview", getOverview);
router.get("/students", getStudents);
router.get("/student/:studentId", getStudentDetails);
router.post("/student/:studentId/analyze", analyzeStudent);

// Phase 2 Routes
router.get("/class-analytics/compare", compareClasses);
router.get("/class-analytics/:classId", getClassAnalytics);
router.get("/class-analytics/:classId/subjects", getClassSubjects);
router.get("/class-analytics/:classId/early-warnings", getEarlyWarnings);
router.post("/class-analytics/:classId/summary", generateClassSummary);

// Phase 3 Routes
router.get("/ai-assistant/conversations", getConversations);
router.post("/ai-assistant/conversations", createConversation);
router.get("/ai-assistant/conversations/:conversationId", getConversation);
router.delete("/ai-assistant/conversations/:conversationId", deleteConversation);
router.patch("/ai-assistant/conversations/:conversationId/clear", clearMessages);
router.post("/ai-assistant/chat", handleChat);

// Phase 4 Routes
router.get("/ai-reports/students", getReportStudents);
router.get("/ai-reports/student/:studentId/data", getStudentReportData);
router.post("/ai-reports/student/:studentId/generate", generateReportSummary);
router.post("/ai-reports/student/:studentId/improvement-plan", generateImprovementPlan);
router.post("/ai-reports/approve", approveReport);
router.get("/ai-reports/:reportId", getReport);

// Phase 5 Routes
router.get("/ai-progress/dashboard", getDashboard);
router.post("/ai-progress/interventions", createIntervention);
router.get("/ai-progress/interventions/:id", getIntervention);
module.exports = router;
