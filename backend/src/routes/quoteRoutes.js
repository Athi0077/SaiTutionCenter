const express = require("express");
const router = express.Router();
const {
  createQuote,
  getQuotes,
  getCurrentQuote,
  updateQuote,
  publishQuote,
  archiveQuote,
} = require("../controllers/quoteController");
const { protect, requireRole } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(protect);

// Public (authenticated) endpoint for dashboards
router.get("/current", getCurrentQuote);

// Principal-only management endpoints
router.use(requireRole("principal"));

router.route("/")
  .post(createQuote)
  .get(getQuotes);

router.route("/:id")
  .put(updateQuote)
  .delete(archiveQuote);

router.post("/:id/publish", publishQuote);

module.exports = router;
