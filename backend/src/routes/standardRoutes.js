const express = require("express");
const router = express.Router();
const {
  createStandard,
  getStandards,
  updateStandard,
  deleteStandard,
  createSection,
  updateSection,
  deleteSection,
} = require("../controllers/standardController");
const { protect, requireRole } = require("../middleware/authMiddleware");

// Protect all routes
router.use(protect);

router.post("/", requireRole("principal"), createStandard);
router.get("/", getStandards); // Accessible by all authenticated users
router.put("/:id", requireRole("principal"), updateStandard);
router.delete("/:id", requireRole("principal"), deleteStandard);

router.post("/sections", requireRole("principal"), createSection);
router.put("/sections/:id", requireRole("principal"), updateSection);
router.delete("/sections/:id", requireRole("principal"), deleteSection);

module.exports = router;
