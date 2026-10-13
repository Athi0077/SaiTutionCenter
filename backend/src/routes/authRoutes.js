const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  logoutUser,
  changePassword,
  refreshToken,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 login requests per windowMs
  message: { success: false, message: "Too many login attempts from this IP, please try again after 15 minutes" },
});

router.post("/login", loginLimiter, loginUser);
router.post("/logout", logoutUser);
router.post("/refresh", refreshToken);
router.get("/me", protect, getUserProfile);
router.post("/change-password", protect, changePassword);

module.exports = router;
