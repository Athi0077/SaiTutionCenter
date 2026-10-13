const express = require("express");
const router = express.Router();
const {
  createTimetable,
  getMyTimetables,
  getClassTimetable,
  updateTimetable,
  deleteTimetable,
  getTeacherTimetable
} = require("../controllers/timetableController");
const { protect, requireRole } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/my-classes", requireRole("teacher"), getMyTimetables);
router.get("/teacher", requireRole("teacher"), getTeacherTimetable);
router.get("/class/:classId", getClassTimetable);

router.post("/", requireRole("teacher"), createTimetable);
router.put("/:id", requireRole("teacher"), updateTimetable);
router.delete("/:id", requireRole("teacher"), deleteTimetable);

module.exports = router;
