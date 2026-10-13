const jwt = require("jsonwebtoken");

const generateAccessToken = (userId, role, sessionVersion = 1) => {
  return jwt.sign({ userId, role, sessionVersion }, process.env.JWT_SECRET, {
    expiresIn: "15m", // Short-lived access token
  });
};

const generateRefreshToken = (userId, sessionVersion = 1) => {
  return jwt.sign({ userId, sessionVersion }, process.env.JWT_SECRET, {
    expiresIn: "30d", // Long-lived refresh token
  });
};

// Keep default export for backwards compatibility where possible, but better to use specific ones.
const generateToken = (userId, role, sessionVersion = 1) => generateAccessToken(userId, role, sessionVersion);
generateToken.generateAccessToken = generateAccessToken;
generateToken.generateRefreshToken = generateRefreshToken;

module.exports = generateToken;
