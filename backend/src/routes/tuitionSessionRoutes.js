const express = require("express");
const router = express.Router();
const tuitionSessionController = require("../controllers/tuitionSessionController");
const { protect, authorize } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(protect);

router.route("/")
  .post(authorize("superadmin", "principal"), tuitionSessionController.createSession)
  .get(tuitionSessionController.getSessions);

router.route("/:id")
  .get(tuitionSessionController.getSessionById)
  .put(authorize("superadmin", "principal"), tuitionSessionController.updateSession)
  .delete(authorize("superadmin", "principal"), tuitionSessionController.deleteSession);

module.exports = router;
