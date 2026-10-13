/**
 * Utility functions for School-local Birthday detection, Age calculation,
 * Leap-year Feb 29 handling, and School Timezone Midnight computation.
 */

const getSchoolTimezone = () => {
  return process.env.SCHOOL_TIMEZONE || 'Asia/Kolkata';
};

/**
 * Returns today's date string 'YYYY-MM-DD' in the school local timezone.
 */
const getSchoolLocalTodayStr = (tz = getSchoolTimezone(), referenceDate = new Date()) => {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(referenceDate); // e.g. "2026-10-02"
  } catch (err) {
    // Fallback if timezone invalid
    const isoStr = referenceDate.toISOString();
    return isoStr.substring(0, 10);
  }
};

/**
 * Calculates the next local 12:00 AM (00:00:00) as a Date object in school timezone.
 */
const getSchoolNextMidnightDate = (tz = getSchoolTimezone(), referenceDate = new Date()) => {
  const todayStr = getSchoolLocalTodayStr(tz, referenceDate);
  const [yearStr, monthStr, dayStr] = todayStr.split('-');
  
  // Tomorrow's date in local school timezone
  const tomorrow = new Date(referenceDate.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowStr = getSchoolLocalTodayStr(tz, tomorrow);
  
  // Construct 00:00:00 of tomorrow in local timezone
  // We can parse using ISO string with offset or Date constructor
  const tomorrowDate = new Date(`${tomorrowStr}T00:00:00.000Z`);
  
  // Calculate exact offset difference for school timezone at midnight
  const localFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    hour12: false
  });
  
  // Find midnight timestamp accurately
  // We can approximate UTC midnight and adjust for timezone offset
  const testMidnight = new Date(`${tomorrowStr}T00:00:00Z`);
  const parts = localFormatter.formatToParts(testMidnight);
  const getPart = (type) => parts.find(p => p.type === type)?.value;
  
  const localHour = parseInt(getPart('hour') || '0', 10) % 24;
  const localMinute = parseInt(getPart('minute') || '0', 10);
  
  const offsetMinutes = (localHour * 60 + localMinute);
  // Subtract offset to get true UTC timestamp of local 00:00:00
  const trueMidnightTimestamp = testMidnight.getTime() - (offsetMinutes * 60 * 1000);
  
  return new Date(trueMidnightTimestamp);
};

/**
 * Checks whether year is a leap year.
 */
const isLeapYear = (year) => {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

/**
 * Checks if a user's dateOfBirth falls on targetDateStr ('YYYY-MM-DD').
 * Handles Feb 29 birthdays by observing on Feb 28 during non-leap years.
 */
const isBirthdayToday = (dateOfBirth, targetDateStr = getSchoolLocalTodayStr()) => {
  if (!dateOfBirth) return false;
  
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return false;
  
  // Extract birth month (1-12) and birth day (1-31) in UTC/standard
  const birthMonth = dob.getUTCMonth() + 1;
  const birthDay = dob.getUTCDate();
  
  const [tYearStr, tMonthStr, tDayStr] = targetDateStr.split('-');
  const targetYear = parseInt(tYearStr, 10);
  const targetMonth = parseInt(tMonthStr, 10);
  const targetDay = parseInt(tDayStr, 10);
  
  // Feb 29 Birthday Handling
  if (birthMonth === 2 && birthDay === 29) {
    if (isLeapYear(targetYear)) {
      return targetMonth === 2 && targetDay === 29;
    } else {
      // Default observance on Feb 28 in non-leap years
      return targetMonth === 2 && targetDay === 28;
    }
  }
  
  return birthMonth === targetMonth && birthDay === targetDay;
};

/**
 * Calculates exact age in years given a dateOfBirth and targetDateStr ('YYYY-MM-DD').
 */
const calculateAge = (dateOfBirth, targetDateStr = getSchoolLocalTodayStr()) => {
  if (!dateOfBirth) return 0;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return 0;
  
  const birthYear = dob.getUTCFullYear();
  const birthMonth = dob.getUTCMonth() + 1;
  const birthDay = dob.getUTCDate();
  
  const [tYearStr, tMonthStr, tDayStr] = targetDateStr.split('-');
  const targetYear = parseInt(tYearStr, 10);
  const targetMonth = parseInt(tMonthStr, 10);
  const targetDay = parseInt(tDayStr, 10);
  
  let age = targetYear - birthYear;
  
  // If target date is before birthday in current year, subtract 1
  if (targetMonth < birthMonth || (targetMonth === birthMonth && targetDay < birthDay)) {
    age -= 1;
  }
  
  return Math.max(0, age);
};

module.exports = {
  getSchoolTimezone,
  getSchoolLocalTodayStr,
  getSchoolNextMidnightDate,
  isLeapYear,
  isBirthdayToday,
  calculateAge,
};
