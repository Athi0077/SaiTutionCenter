const express = require("express");
const router = express.Router();
const {
  previewPromotion,
  confirmPromotion,
  getPromotionHistory
} = require("../controllers/promotionController");
const { protect, requireRole } = require("../middleware/authMiddleware");

router.post("/preview", protect, requireRole("principal"), previewPromotion);
router.post("/confirm", protect, requireRole("principal"), confirmPromotion);
router.get("/history", protect, requireRole("principal"), getPromotionHistory);

module.exports = router;
