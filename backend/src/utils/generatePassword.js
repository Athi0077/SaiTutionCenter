const crypto = require("crypto");

/**
 * Generates a secure, 12-character temporary password.
 * Uses a larger character set to ensure > 60 bits of entropy
 * while remaining student-friendly (avoids ambiguous characters like l, 1, O, 0).
 */
const generateSecureTempPassword = () => {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789@#$';
  let password = '';
  const randomBytes = crypto.randomBytes(12);
  
  for (let i = 0; i < 12; i++) {
    password += chars[randomBytes[i] % chars.length];
  }
  return password;
};

module.exports = generateSecureTempPassword;
