const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  createLeaveRequest,
  getMyLeaveRequests,
  getAllLeaveRequests,
  updateLeaveStatus
} = require("../controllers/staffLeaveController");

// Teacher routes
router.post("/", protect, authorize("teacher"), createLeaveRequest);
router.get("/my", protect, authorize("teacher"), getMyLeaveRequests);

// Principal routes
router.get("/", protect, authorize("principal"), getAllLeaveRequests);
router.put("/:id/status", protect, authorize("principal"), updateLeaveStatus);

module.exports = router;
