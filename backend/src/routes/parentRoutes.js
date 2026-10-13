const express = require("express");
const router = express.Router();
const { createParent, getParents, updateParent, deleteParent } = require("../controllers/parentController");
const { protect, requireRole } = require("../middleware/authMiddleware");

router.post("/", protect, requireRole("principal", "teacher"), createParent);
router.get("/", protect, requireRole("principal", "teacher"), getParents);
router.put("/:id", protect, requireRole("principal", "teacher"), updateParent);
router.delete("/:id", protect, requireRole("principal", "teacher"), deleteParent);

module.exports = router;
