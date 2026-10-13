const express = require("express");
const router = express.Router();
const { admitStudent } = require("../controllers/admissionController");
const { protect, requireRole } = require("../middleware/authMiddleware");

router.post("/", protect, requireRole("principal"), admitStudent);

module.exports = router;
