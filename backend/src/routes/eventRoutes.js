const express = require("express");
const router = express.Router();
const {
  createEvent,
  updateEvent,
  updateEventStatus,
  getAllEvents,
  getEventById,
  getPublishedEvents,
  joinEvent,
  getEventParticipants,
  submitResults,
  getResults,
  reviewResults,
  getPendingResults,
  uploadEventPhoto,
  deleteEventPhoto,
  getAllEventPhotos
} = require("../controllers/eventController");
const { protect, requireRole } = require("../middleware/authMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

// ==========================================
// PRINCIPAL ROUTES
// ==========================================
router.post("/", protect, requireRole("principal"), createEvent);
router.put("/:id", protect, requireRole("principal"), updateEvent);
router.put("/:id/status", protect, requireRole("principal"), updateEventStatus);
router.get("/all", protect, requireRole("principal"), getAllEvents);
router.get("/pending-results", protect, requireRole("principal"), getPendingResults);
router.put("/:id/results/review", protect, requireRole("principal"), reviewResults);
router.post("/gallery", protect, requireRole("principal"), upload.single("photo"), uploadEventPhoto);
router.delete("/gallery/:id", protect, requireRole("principal"), deleteEventPhoto);

// ==========================================
// TEACHER & STUDENT ROUTES
// ==========================================
router.get("/", protect, getPublishedEvents);

// ==========================================
// STUDENT ROUTES
// ==========================================
router.post("/:id/join", protect, requireRole("student"), joinEvent);

// ==========================================
// TEACHER & PRINCIPAL ROUTES
// ==========================================
router.get("/:id/participants", protect, requireRole("principal", "teacher"), getEventParticipants);
router.post("/:id/results", protect, requireRole("teacher"), submitResults);

// ==========================================
// SHARED ROUTES (Everyone)
// ==========================================
router.get("/gallery", protect, getAllEventPhotos);
router.get("/:id", protect, getEventById);
router.get("/:id/results", protect, getResults);

module.exports = router;
