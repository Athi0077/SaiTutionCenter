const express = require("express");
const router = express.Router();
const {
  getAcademicYears,
  getAcademicYearById,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  activateAcademicYear
} = require("../controllers/academicYearController");
const { protect, requireRole } = require("../middleware/authMiddleware");

router.get("/", protect, getAcademicYears);
router.get("/:id", protect, getAcademicYearById);
router.post("/", protect, requireRole("principal"), createAcademicYear);
router.put("/:id", protect, requireRole("principal"), updateAcademicYear);
router.delete("/:id", protect, requireRole("principal"), deleteAcademicYear);
router.put("/:id/activate", protect, requireRole("principal"), activateAcademicYear);

module.exports = router;
