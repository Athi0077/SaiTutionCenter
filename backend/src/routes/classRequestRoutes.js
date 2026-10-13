const express = require("express");
const router = express.Router();
const {
  createRequest,
  getMyClassRequests,
  approveRequest,
  rejectRequest,
  getMyRequests,
} = require("../controllers/classRequestController");
const { protect, requireRole } = require("../middleware/authMiddleware");

router.post("/", protect, requireRole("student"), createRequest);
router.get("/my-classes", protect, requireRole("teacher"), getMyClassRequests);
router.get("/my-requests", protect, requireRole("student"), getMyRequests);
router.patch("/:requestId/approve", protect, requireRole("teacher"), approveRequest);
router.patch("/:requestId/reject", protect, requireRole("teacher"), rejectRequest);

module.exports = router;
