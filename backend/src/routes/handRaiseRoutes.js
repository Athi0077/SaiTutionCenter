const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

const {
  createHandRaise,
  getMyHandRaises,
  getReceivedHandRaises,
  getHandRaiseById,
  markAsViewed,
  addResponse,
  scheduleMeeting,
  rescheduleMeeting,
  cancelMeeting,
  completeHandRaise,
  getStats,
  getTargetUsers
} = require("../controllers/handRaiseController");

router.use(protect);

router.post("/", createHandRaise);
router.get("/my", getMyHandRaises);
router.get("/received", getReceivedHandRaises);
router.get("/stats", getStats);
router.get("/targets", getTargetUsers);
router.get("/:id", getHandRaiseById);

router.put("/:id/view", markAsViewed);
router.put("/:id/respond", addResponse);
router.put("/:id/schedule", scheduleMeeting);
router.put("/:id/reschedule", rescheduleMeeting);
router.put("/:id/cancel", cancelMeeting);
router.put("/:id/complete", completeHandRaise);

module.exports = router;
