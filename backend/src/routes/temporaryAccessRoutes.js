const express = require("express");
const router = express.Router();
const {
  grantAccess,
  getAllAccessRecords,
  getMyAccess, 
  getAccessRecord,
  revokeAccess
} = require("../controllers/temporaryAccessController");
const { protect, requireRole, requireMainPrincipal } = require("../middleware/authMiddleware");

// Route for a teacher to check their own access
router.get("/my-access", protect, requireRole("teacher", "principal"), getMyAccess);

// Protect all other routes to require Main Principal (no Temp Principals allowed to grant/revoke)
router.use(protect);
router.use(requireRole("principal"));
router.use(requireMainPrincipal);

router.route("/")
  .post(grantAccess)
  .get(getAllAccessRecords);

router.route("/:id")
  .get(getAccessRecord);

router.patch("/:id/revoke", revokeAccess);

module.exports = router;
