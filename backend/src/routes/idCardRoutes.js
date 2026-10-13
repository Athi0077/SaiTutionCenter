const express = require("express");
const router = express.Router();
const {
  getMyIDCard,
  getUserIDCard,
  updateIDCard,
  verifyIDCard,
  getAllUsersForIDCard,
  getSchoolName,
  updateSchoolName,
} = require("../controllers/idCardController");
const { protect, requireRole } = require("../middleware/authMiddleware");

// Public route for QR verification
router.get("/verify/:verificationId", verifyIDCard);
router.get("/school-name", getSchoolName);

// Protected routes
router.get("/mine", protect, getMyIDCard);

// Principal only routes
router.get("/users", protect, requireRole("principal"), getAllUsersForIDCard);
router.put("/school-name", protect, requireRole("principal"), updateSchoolName);
router.get("/:id", protect, requireRole("principal"), getUserIDCard);
router.put("/:id", protect, requireRole("principal"), updateIDCard);

module.exports = router;
