const express = require("express");
const router = express.Router();
const {
  getTodayBirthdays,
  getTodayWishes,
  createWish,
  deleteWish,
} = require("../controllers/birthdayController");
const { protect, requireRole } = require("../middleware/authMiddleware");

router.get("/today", protect, getTodayBirthdays);
router.get("/today/wishes", protect, getTodayWishes);
router.post("/:targetUserId/wishes", protect, requireRole("principal", "teacher"), createWish);
router.delete("/wishes/:wishId", protect, deleteWish);

module.exports = router;
