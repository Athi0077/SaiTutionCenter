const express = require("express");
const router = express.Router();
const { 
  createTest, 
  getTests, 
  enterMarks, 
  getMarks, 
  getMyMarks 
} = require("../controllers/tuitionTestController");
const { protect, requireRole } = require("../middleware/authMiddleware");

const allowManage = requireRole("principal", "teacher");

router.post("/", protect, allowManage, createTest);
router.get("/", protect, getTests);

router.get("/my-marks", protect, requireRole("student"), getMyMarks);

router.post("/:testId/marks", protect, allowManage, enterMarks);
router.get("/:testId/marks", protect, allowManage, getMarks);

module.exports = router;
