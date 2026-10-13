const User = require("../models/User");
const Settings = require("../models/Settings");

// @desc    Get dashboard statistics
// @route   GET /api/super-admin/dashboard
// @access  Private/SuperAdmin
const getDashboardStats = async (req, res) => {
  try {
    const roles = ["student", "teacher", "principal", "parent"];
    
    const countPromises = roles.map(role => 
      User.countDocuments({ role: role, status: { $ne: "blocked" } })
    );

    const counts = await Promise.all(countPromises);
    
    const stats = {
      student: counts[0],
      teacher: counts[1],
      principal: counts[2],
      parent: counts[3],
    };

    const totalRegistered = counts.reduce((a, b) => a + b, 0);

    let settings = await Settings.findOne();
    const amounts = settings?.calculatorAmounts || { student: 0, teacher: 0, principal: 0, parent: 0 };
    
    const totals = {
      student: stats.student * (amounts.student || 0),
      teacher: stats.teacher * (amounts.teacher || 0),
      principal: stats.principal * (amounts.principal || 0),
      parent: stats.parent * (amounts.parent || 0)
    };

    const grandTotal = totals.student + totals.teacher + totals.principal + totals.parent;

    res.json({
      success: true,
      stats,
      totalRegistered,
      grandTotal,
      lastUpdated: new Date()
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get account counts
// @route   GET /api/super-admin/account-counts
// @access  Private/SuperAdmin
const getAccountCounts = async (req, res) => {
  try {
    const roles = ["student", "teacher", "principal", "parent"];
    
    const countPromises = roles.map(role => 
      User.countDocuments({ role: role, status: { $ne: "blocked" } })
    );

    const counts = await Promise.all(countPromises);
    
    const stats = {
      student: counts[0],
      teacher: counts[1],
      principal: counts[2],
      parent: counts[3],
    };

    res.json({
      success: true,
      counts: stats,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get calculator amounts
// @route   GET /api/super-admin/calculator
// @access  Private/SuperAdmin
const getCalculatorAmounts = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create({});
    }

    // Get current counts to return calculation
    const roles = ["student", "teacher", "principal", "parent"];
    
    const countPromises = roles.map(role => 
      User.countDocuments({ role: role, status: { $ne: "blocked" } })
    );

    const counts = await Promise.all(countPromises);
    
    const stats = {
      student: counts[0],
      teacher: counts[1],
      principal: counts[2],
      parent: counts[3],
    };

    const amounts = settings.calculatorAmounts || { student: 0, teacher: 0, principal: 0, parent: 0 };

    const totals = {
      student: stats.student * (amounts.student || 0),
      teacher: stats.teacher * (amounts.teacher || 0),
      principal: stats.principal * (amounts.principal || 0),
      parent: stats.parent * (amounts.parent || 0)
    };

    const grandTotal = totals.student + totals.teacher + totals.principal + totals.parent;

    res.json({
      success: true,
      amounts,
      counts: stats,
      totals,
      grandTotal,
      updatedBy: settings.updatedBy,
      updatedAt: settings.updatedAt
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update calculator amounts
// @route   PUT /api/super-admin/calculator
// @access  Private/SuperAdmin
const updateCalculatorAmounts = async (req, res) => {
  try {
    const { student, teacher, principal, parent } = req.body;
    
    // Validate inputs
    if (student < 0 || teacher < 0 || principal < 0 || parent < 0 || 
        isNaN(student) || isNaN(teacher) || isNaN(principal) || isNaN(parent) ||
        !isFinite(student) || !isFinite(teacher) || !isFinite(principal) || !isFinite(parent)) {
      return res.status(400).json({ success: false, message: "Invalid amounts" });
    }

    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings({});
    }

    settings.calculatorAmounts = {
      student: Number(student),
      teacher: Number(teacher),
      principal: Number(principal),
      parent: Number(parent)
    };
    settings.updatedBy = req.user._id;

    await settings.save();

    // Recalculate
    const roles = ["student", "teacher", "principal", "parent"];
    const countPromises = roles.map(role => 
      User.countDocuments({ role: role, status: { $ne: "blocked" } })
    );
    const countsArray = await Promise.all(countPromises);
    
    const counts = {
      student: countsArray[0],
      teacher: countsArray[1],
      principal: countsArray[2],
      parent: countsArray[3],
    };

    const totals = {
      student: counts.student * settings.calculatorAmounts.student,
      teacher: counts.teacher * settings.calculatorAmounts.teacher,
      principal: counts.principal * settings.calculatorAmounts.principal,
      parent: counts.parent * settings.calculatorAmounts.parent
    };

    const grandTotal = totals.student + totals.teacher + totals.principal + totals.parent;

    res.json({
      success: true,
      amounts: settings.calculatorAmounts,
      counts,
      totals,
      grandTotal,
      updatedBy: settings.updatedBy,
      updatedAt: settings.updatedAt
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new Principal
// @route   POST /api/super-admin/principals
// @access  Private/SuperAdmin
const createPrincipal = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: "User already exists with this email" });
    }

    const principal = await User.create({
      name,
      email,
      password,
      phone,
      role: "principal",
      status: "active",
      createdBy: req.user._id,
      createdByRole: "superadmin"
    });

    res.status(201).json({
      success: true,
      message: "Principal account created successfully",
      data: {
        id: principal._id,
        name: principal.name,
        email: principal.email,
        status: principal.status
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all Principals
// @route   GET /api/super-admin/principals
// @access  Private/SuperAdmin
const getPrincipals = async (req, res) => {
  try {
    const principals = await User.find({ role: "principal" })
      .select("-password")
      .populate("createdBy", "name email");

    res.json({
      success: true,
      data: principals
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Activate Principal
// @route   PUT /api/super-admin/principals/:id/activate
// @access  Private/SuperAdmin
const activatePrincipal = async (req, res) => {
  try {
    const principal = await User.findOne({ _id: req.params.id, role: "principal" });
    if (!principal) {
      return res.status(404).json({ success: false, message: "Principal not found" });
    }

    principal.status = "active";
    principal.sessionVersion = (principal.sessionVersion || 1) + 1; // invalidate old sessions just in case
    await principal.save();

    res.json({
      success: true,
      message: "Principal account activated successfully",
      data: principal
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Deactivate Principal
// @route   PUT /api/super-admin/principals/:id/deactivate
// @access  Private/SuperAdmin
const deactivatePrincipal = async (req, res) => {
  try {
    const principal = await User.findOne({ _id: req.params.id, role: "principal" });
    if (!principal) {
      return res.status(404).json({ success: false, message: "Principal not found" });
    }

    principal.status = "inactive";
    principal.sessionVersion = (principal.sessionVersion || 1) + 1; // invalidate active sessions
    await principal.save();

    res.json({
      success: true,
      message: "Principal account deactivated successfully",
      data: principal
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset Principal Password
// @route   PUT /api/super-admin/principals/:id/reset-password
// @access  Private/SuperAdmin
const resetPrincipalPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters long." });
    }

    const principal = await User.findOne({ _id: req.params.id, role: "principal" });
    if (!principal) {
      return res.status(404).json({ success: false, message: "Principal not found" });
    }

    principal.password = newPassword;
    principal.mustChangePassword = true;
    principal.sessionVersion = (principal.sessionVersion || 1) + 1; // force logout
    await principal.save();

    const SecurityEvent = require("../models/SecurityEvent");
    await SecurityEvent.create({
      actorId: req.user._id,
      targetId: principal._id,
      eventType: "password_reset",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    res.json({
      success: true,
      message: "Principal password reset successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getAccountCounts,
  getCalculatorAmounts,
  updateCalculatorAmounts,
  createPrincipal,
  getPrincipals,
  activatePrincipal,
  deactivatePrincipal,
  resetPrincipalPassword
};
