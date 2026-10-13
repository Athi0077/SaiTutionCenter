const express = require("express");
const router = express.Router();
const {
  createLeaveRequest,
  getMyLeaveRequests,
  getTeacherLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
} = require("../controllers/leaveController");
const { protect, requireRole } = require("../middleware/authMiddleware");

router.post("/", protect, requireRole("student"), createLeaveRequest);
router.get("/my", protect, requireRole("student"), getMyLeaveRequests);
router.get("/teacher", protect, requireRole("teacher"), getTeacherLeaveRequests);
router.patch("/:id/approve", protect, requireRole("teacher"), approveLeaveRequest);
router.patch("/:id/reject", protect, requireRole("teacher"), rejectLeaveRequest);

module.exports = router;
