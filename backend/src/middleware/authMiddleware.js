const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.userId).select("-password");

      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authorized, user not found" });
      }

      // Check session version safely
      const userSessionVersion = req.user.sessionVersion || 1;
      const tokenSessionVersion = decoded.sessionVersion || 1;
      if (tokenSessionVersion !== userSessionVersion) {
        return res.status(401).json({ success: false, message: "Session expired or revoked" });
      }

      // (Removed mandatory password change block for students)
      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized, no token" });
  }
};

const requireRole = (...roles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }
    
    // Normal role check
    if (roles.includes(req.user.role)) {
      return next();
    }
    
    // Check Temporary Principal Access if "principal" role is required
    if (roles.includes("principal") && req.user.role === "teacher") {
      const TemporaryPrincipalAccess = require("../models/TemporaryPrincipalAccess");
      const now = new Date();
      
      const activeAccess = await TemporaryPrincipalAccess.findOne({
        teacherId: req.user._id,
        status: { $nin: ["Revoked", "Expired"] },
        startAt: { $lte: now },
        expiresAt: { $gt: now }
      });
      
      if (activeAccess) {
        req.user.isTempPrincipal = true; // Flag for restricted operations
        return next();
      }
    }
    
    return res.status(403).json({ success: false, message: "Access denied" });
  };
};

const requireMainPrincipal = (req, res, next) => {
  console.log("requireMainPrincipal hit!", "Role:", req.user?.role, "isTempPrincipal:", req.user?.isTempPrincipal);
  if (req.user && req.user.role === "principal" && !req.user.isTempPrincipal) {
    return next();
  }
  return res.status(403).json({ success: false, message: "Action restricted to Main Principal only" });
};

const requireSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === "superadmin") {
    return next();
  }
  return res.status(403).json({ success: false, message: "Action restricted to Super Admin only" });
};

module.exports = { protect, requireRole, authorize: requireRole, requireMainPrincipal, requireSuperAdmin };
