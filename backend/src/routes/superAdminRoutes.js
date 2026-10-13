const express = require("express");
const router = express.Router();
const { protect, requireSuperAdmin } = require("../middleware/authMiddleware");
const {
  getDashboardStats,
  getAccountCounts,
  getCalculatorAmounts,
  updateCalculatorAmounts,
  createPrincipal,
  getPrincipals,
  activatePrincipal,
  deactivatePrincipal,
  resetPrincipalPassword
} = require("../controllers/superAdminController");

router.use(protect);
router.use(requireSuperAdmin);

router.get("/dashboard", getDashboardStats);
router.get("/account-counts", getAccountCounts);
router.get("/calculator", getCalculatorAmounts);
router.put("/calculator", updateCalculatorAmounts);

// Principal Management
router.post("/principals", createPrincipal);
router.get("/principals", getPrincipals);
router.put("/principals/:id/activate", activatePrincipal);
router.put("/principals/:id/deactivate", deactivatePrincipal);
router.put("/principals/:id/reset-password", resetPrincipalPassword);

module.exports = router;
