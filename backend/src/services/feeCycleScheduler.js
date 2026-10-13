const TuitionFee = require("../models/TuitionFee");
const FeeStatus = require("../models/FeeStatus");

/**
 * Check all fees and automatically reset to PENDING when a new billing cycle arrives:
 * - Monthly: Resets to PENDING on the 1st of every month (or whenever current month > lastBilledMonth).
 * - Yearly: Resets to PENDING once a year (whenever current year > lastBilledYear).
 */
const checkAndRolloverFees = async () => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;

    // 1. Process Monthly Fees
    const monthlyFees = await TuitionFee.find({
      $or: [
        { feePeriod: "Monthly" },
        { feePeriod: { $exists: false } },
        { feePeriod: null }
      ]
    });

    let monthlyResetCount = 0;
    for (const fee of monthlyFees) {
      if (!fee.lastBilledMonth) {
        // Initialize if not set
        fee.lastBilledMonth = currentMonthKey;
        fee.lastBilledYear = currentYear;
        fee.lastResetDate = now;
        if (!fee.feePeriod) fee.feePeriod = "Monthly";
        await fee.save();
        continue;
      }

      // If last billed month is before current month, rollover to PENDING
      if (fee.lastBilledMonth < currentMonthKey) {
        fee.status = "PENDING";
        fee.paidAmount = 0;
        fee.lastBilledMonth = currentMonthKey;
        fee.lastBilledYear = currentYear;
        fee.lastResetDate = now;
        await fee.save();

        // Also sync FeeStatus
        await FeeStatus.updateMany(
          { studentId: fee.studentId },
          {
            $set: {
              feeStatus: "pending",
              feePeriod: "Monthly",
              lastBilledMonth: currentMonthKey,
              lastBilledYear: currentYear,
              lastResetDate: now,
              statusUpdatedAt: now
            }
          }
        );
        monthlyResetCount++;
      }
    }

    // 2. Process Yearly Fees
    const yearlyFees = await TuitionFee.find({ feePeriod: "Yearly" });
    let yearlyResetCount = 0;
    for (const fee of yearlyFees) {
      if (!fee.lastBilledYear) {
        fee.lastBilledYear = currentYear;
        fee.lastBilledMonth = currentMonthKey;
        fee.lastResetDate = now;
        await fee.save();
        continue;
      }

      // If last billed year is before current year, rollover to PENDING
      if (fee.lastBilledYear < currentYear) {
        fee.status = "PENDING";
        fee.paidAmount = 0;
        fee.lastBilledYear = currentYear;
        fee.lastBilledMonth = currentMonthKey;
        fee.lastResetDate = now;
        await fee.save();

        // Also sync FeeStatus
        await FeeStatus.updateMany(
          { studentId: fee.studentId },
          {
            $set: {
              feeStatus: "pending",
              feePeriod: "Yearly",
              lastBilledMonth: currentMonthKey,
              lastBilledYear: currentYear,
              lastResetDate: now,
              statusUpdatedAt: now
            }
          }
        );
        yearlyResetCount++;
      }
    }

    if (monthlyResetCount > 0 || yearlyResetCount > 0) {
      console.log(`[FeeCycleScheduler] Auto-reset: ${monthlyResetCount} monthly fee(s) and ${yearlyResetCount} yearly fee(s) changed to PENDING.`);
    }

    return { monthlyResetCount, yearlyResetCount };
  } catch (error) {
    console.error("[FeeCycleScheduler] Error running fee rollover check:", error.message);
  }
};

let feeSchedulerTimer = null;

const initFeeCycleScheduler = () => {
  // Run on startup
  checkAndRolloverFees();

  if (feeSchedulerTimer) {
    clearInterval(feeSchedulerTimer);
  }

  // Periodic check every 15 minutes
  const FIFTEEN_MINUTES = 15 * 60 * 1000;
  feeSchedulerTimer = setInterval(() => {
    checkAndRolloverFees();
  }, FIFTEEN_MINUTES);

  console.log("[FeeCycleScheduler] Fee cycle scheduler initialized (Monthly 1st & Yearly auto-reset).");
};

const stopFeeCycleScheduler = () => {
  if (feeSchedulerTimer) {
    clearInterval(feeSchedulerTimer);
    feeSchedulerTimer = null;
  }
};

module.exports = {
  checkAndRolloverFees,
  initFeeCycleScheduler,
  stopFeeCycleScheduler,
};
