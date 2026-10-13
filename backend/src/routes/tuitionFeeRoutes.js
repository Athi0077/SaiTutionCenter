const express = require("express");
const router = express.Router();
const { 
  createFee,
  getFees,
  recordPayment,
  updateFeeStatus,
  getMyFees
} = require("../controllers/tuitionFeeController");
const { protect, requireRole } = require("../middleware/authMiddleware");

// Admin routes
router.post("/", protect, requireRole("principal", "superadmin", "teacher"), createFee);
router.get("/", protect, requireRole("principal", "superadmin", "teacher"), getFees);
router.post("/:id/pay", protect, requireRole("principal", "superadmin", "teacher"), recordPayment);
router.put("/:id/status", protect, requireRole("principal", "superadmin", "teacher"), updateFeeStatus);

// Student/Parent routes
router.get("/my-fees", protect, requireRole("student", "parent"), getMyFees);

module.exports = router;
