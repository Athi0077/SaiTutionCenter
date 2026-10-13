const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (role === "principal") {
      return res.status(403).json({ success: false, message: "Unauthorized: Principal accounts can only be created by the Super Admin." });
    }

    if (role === "teacher") {
      return res.status(400).json({ success: false, message: "Public registration is only available for students." });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    let status = "active";
    if (role === "teacher") {
      status = "pending";
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || "student",
      status,
    });

    if (user) {
      if (user.role === 'student' && req.body.classId) {
        const Class = require("../models/Class");
        const Enrollment = require("../models/Enrollment");
        const AcademicYear = require("../models/AcademicYear");
        
        // Auto-enroll the student directly into the class
        const targetClass = await Class.findById(req.body.classId);
        if (targetClass) {
          if (!targetClass.students.includes(user._id)) {
            targetClass.students.push(user._id);
            await targetClass.save();
          }

          // Create active enrollment if there's an active academic year
          const activeYear = await AcademicYear.findOne({ status: 'active' });
          if (activeYear) {
            await Enrollment.create({
              studentId: user._id,
              academicYearId: activeYear._id,
              classId: targetClass._id,
              status: "active",
              type: "new_admission"
            });
          }
        }
      }

      const sessionVersion = user.sessionVersion || 1;
      const accessToken = generateToken.generateAccessToken(user._id, user.role, sessionVersion);
      const refreshToken = generateToken.generateRefreshToken(user._id, sessionVersion);

      res.cookie("jwt_refresh", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        token: accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          profilePic: user.profilePic,
        },
      });
    } else {
      res.status(400).json({ success: false, message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const identifier = email ? email.trim() : "";
    const SecurityEvent = require("../models/SecurityEvent");

    const user = await User.findOne({ 
      $or: [
        { email: identifier.toLowerCase() },
        { mobileNumber: identifier },
        { phone: identifier },
        { studentId: identifier }
      ] 
    });

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials (email, mobile number, or password)" });
    }

    // Check rate limit lock
    if (user.lockUntil && user.lockUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockUntil - new Date()) / 60000);
      return res.status(429).json({ success: false, message: `Account temporarily locked. Try again in ${waitMinutes} minutes.` });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      let lockMessage = "Invalid email or password";
      if (user.loginAttempts >= 5) {
        // Lock for 15 minutes
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        lockMessage = "Account temporarily locked due to too many failed attempts.";
        
        await SecurityEvent.create({
          targetId: user._id,
          eventType: "account_locked",
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"]
        });
      }
      await user.save();

      await SecurityEvent.create({
        targetId: user._id,
        eventType: "login_failed",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      });

      return res.status(401).json({ success: false, message: lockMessage });
    }

    if (user.status === "blocked" || user.status === "inactive") {
      if (user.role === "principal") {
        return res.status(403).json({ success: false, message: "Your Principal account is currently inactive. Please contact the Super Admin." });
      }
      return res.status(403).json({ success: false, message: "Account is disabled" });
    }

    if (user.role === "principal") {
      // Validate that it was created by superadmin or is an existing active legacy account.
      // We will allow existing active accounts to login, but any new or updated account will need createdByRole
      if (!user.createdByRole && user.createdAt > new Date("2026-10-01")) {
        // Just an extra safety, though register route prevents new ones now.
      }
    }

    if (user.status === "pending" && user.role === "teacher") {
      return res.status(403).json({ success: false, message: "Your account is waiting for Principal approval." });
    }

    // Reset lock state
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    await SecurityEvent.create({
      actorId: user._id,
      targetId: user._id,
      eventType: "login_success",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    const sessionVersion = user.sessionVersion || 1;
    const accessToken = generateToken.generateAccessToken(user._id, user.role, sessionVersion);
    const refreshToken = generateToken.generateRefreshToken(user._id, sessionVersion);

    res.cookie("jwt_refresh", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        status: user.status,
        profilePic: user.profilePic,
        mustChangePassword: user.mustChangePassword,
        dateOfBirth: user.dateOfBirth,
        bloodGroup: user.bloodGroup
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (user) {
      let hasTempAccess = false;
      if (user.role === "teacher") {
        const TemporaryPrincipalAccess = require("../models/TemporaryPrincipalAccess");
        const now = new Date();
        const activeAccess = await TemporaryPrincipalAccess.findOne({
          teacherId: user._id,
          status: "Active",
          startAt: { $lte: now },
          expiresAt: { $gt: now }
        });
        if (activeAccess) hasTempAccess = true;
      }

      res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          role: user.role,
          status: user.status,
          profilePic: user.profilePic,
          dateOfBirth: user.dateOfBirth,
          bloodGroup: user.bloodGroup,
          tempPrincipalAccess: hasTempAccess
        },
      });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logout user (client-side clears token)
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = async (req, res) => {
  res.cookie("jwt_refresh", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    expires: new Date(0),
  });
  res.json({ success: true, message: "Logged out successfully" });
};

// @desc    Change Password
// @route   POST /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Incorrect current password" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long." });
    }

    if (newPassword === user.studentId || newPassword.toLowerCase() === user.name.toLowerCase()) {
      return res.status(400).json({ success: false, message: "Password cannot be your name or Student ID." });
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    user.sessionVersion = (user.sessionVersion || 1) + 1;
    await user.save();

    const SecurityEvent = require("../models/SecurityEvent");
    await SecurityEvent.create({
      actorId: user._id,
      targetId: user._id,
      eventType: "password_change",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    const accessToken = generateToken.generateAccessToken(user._id, user.role, user.sessionVersion);
    const refreshToken = generateToken.generateRefreshToken(user._id, user.sessionVersion);

    res.cookie("jwt_refresh", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Password changed successfully",
      token: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mustChangePassword: user.mustChangePassword
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.jwt_refresh;
    if (!token) {
      return res.status(401).json({ success: false, message: "No refresh token provided" });
    }

    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    if (user.status === "blocked" || user.status === "inactive") {
      return res.status(403).json({ success: false, message: "Account is disabled" });
    }

    const userSessionVersion = user.sessionVersion || 1;
    const tokenSessionVersion = decoded.sessionVersion || 1;
    if (tokenSessionVersion !== userSessionVersion) {
      return res.status(401).json({ success: false, message: "Session expired or revoked" });
    }

    const newAccessToken = generateToken.generateAccessToken(user._id, user.role, userSessionVersion);
    const newRefreshToken = generateToken.generateRefreshToken(user._id, userSessionVersion);

    res.cookie("jwt_refresh", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      token: newAccessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        status: user.status,
        profilePic: user.profilePic,
        mustChangePassword: user.mustChangePassword,
      }
    });
  } catch (error) {
    res.cookie("jwt_refresh", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      expires: new Date(0),
    });
    return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  logoutUser,
  changePassword,
  refreshToken,
};
