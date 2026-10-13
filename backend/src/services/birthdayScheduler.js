const BirthdayWish = require("../models/BirthdayWish");
const { getSchoolLocalTodayStr, getSchoolNextMidnightDate } = require("../utils/birthdayUtils");

/**
 * Idempotently cleans up expired birthday wishes.
 * Safe to call repeatedly and across multiple server instances.
 */
const cleanupExpiredWishes = async () => {
  try {
    const todayStr = getSchoolLocalTodayStr();
    const now = new Date();

    const result = await BirthdayWish.deleteMany({
      $or: [
        { expiresAt: { $lte: now } },
        { celebrationDate: { $lt: todayStr } }
      ]
    });

    if (result.deletedCount > 0) {
      console.log(`[BirthdayScheduler] Idempotently cleaned up ${result.deletedCount} expired birthday wish(es).`);
    }
    return result.deletedCount;
  } catch (error) {
    console.error("[BirthdayScheduler] Error during cleanupExpiredWishes:", error.message);
    return 0;
  }
};

let schedulerTimer = null;

/**
 * Initializes birthday scheduler on server startup.
 * Runs immediate cleanup and schedules periodic check every 30 minutes & at local midnight.
 */
const initBirthdayScheduler = () => {
  // Run immediate cleanup on startup
  cleanupExpiredWishes();

  if (schedulerTimer) {
    clearInterval(schedulerTimer);
  }

  // Check every 30 minutes for expired items
  const THIRTY_MINUTES = 30 * 60 * 1000;
  schedulerTimer = setInterval(() => {
    cleanupExpiredWishes();
  }, THIRTY_MINUTES);

  console.log("[BirthdayScheduler] Birthday scheduler initialized for school local calendar.");
};

const stopBirthdayScheduler = () => {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
};

module.exports = {
  cleanupExpiredWishes,
  initBirthdayScheduler,
  stopBirthdayScheduler,
};
