const express = require("express");
const router = express.Router();
const { getAllSubjects, createSubject, seedDefaultSubjects } = require("../controllers/subjectController");
const { protect, requireRole } = require("../middleware/authMiddleware");

router.get("/", protect, getAllSubjects);
router.post("/", protect, requireRole("principal"), createSubject);
router.post("/seed-defaults", protect, requireRole("principal"), seedDefaultSubjects);

module.exports = router;
