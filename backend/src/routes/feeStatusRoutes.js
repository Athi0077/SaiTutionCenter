const express = require("express");
const router = express.Router();
const {
  getClassFeeStatuses,
  updateStudentFeeStatus,
  getMyFeeStatus,
  getChildFeeStatus,
  getMyChildrenFeeStatuses,
} = require("../controllers/feeStatusController");
const { protect, requireRole } = require("../middleware/authMiddleware");

// Teacher routes
router.get("/class/:classId", protect, requireRole("teacher"), getClassFeeStatuses);
router.put("/student/:studentId", protect, requireRole("teacher"), updateStudentFeeStatus);

// Student route
router.get("/my-status", protect, requireRole("student"), getMyFeeStatus);

// Parent routes
router.get("/my-children", protect, requireRole("parent"), getMyChildrenFeeStatuses);
router.get("/child/:childId", protect, requireRole("parent"), getChildFeeStatus);

module.exports = router;
