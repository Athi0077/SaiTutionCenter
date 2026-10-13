const express = require("express");
const router = express.Router();
const {
  getUncoveredPeriods,
  assignSubstitute,
  updateSubstitute,
} = require("../controllers/substituteController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

// Principal routes for Substitute Management
router.get("/uncovered", authorize("principal", "superadmin"), getUncoveredPeriods);
router.post("/", authorize("principal", "superadmin"), assignSubstitute);
router.put("/:id", authorize("principal", "superadmin"), updateSubstitute);

module.exports = router;
