const TemporaryPrincipalAccess = require("../models/TemporaryPrincipalAccess");
const User = require("../models/User");

// @desc    Grant temporary principal access to a teacher
// @route   POST /api/temporary-principal-access
// @access  Private (Main Principal)
const grantAccess = async (req, res) => {
  try {
    const { teacherId, startAt, expiresAt, reason } = req.body;

    // Validate teacher exists and is a teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== "teacher") {
      return res.status(400).json({ success: false, message: "Invalid teacher selected" });
    }

    // Check for existing overlapping active/scheduled access
    const overlappingAccess = await TemporaryPrincipalAccess.findOne({
      teacherId,
      status: { $nin: ["Revoked", "Expired"] },
      $or: [
        { startAt: { $lt: new Date(expiresAt) }, expiresAt: { $gt: new Date(startAt) } }
      ]
    });

    if (overlappingAccess) {
      return res.status(400).json({ success: false, message: "Teacher already has active or scheduled access during this period" });
    }

    // Set initial status
    const now = new Date();
    let initialStatus = "Scheduled";
    if (new Date(startAt) <= now && new Date(expiresAt) >= now) {
      initialStatus = "Active";
    }

    const accessRecord = await TemporaryPrincipalAccess.create({
      teacherId,
      grantedBy: req.user._id,
      originalRole: teacher.role,
      startAt,
      expiresAt,
      reason,
      status: initialStatus
    });

    res.status(201).json({ success: true, data: accessRecord });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all temporary access records
// @route   GET /api/temporary-principal-access
// @access  Private (Main Principal)
const getAllAccessRecords = async (req, res) => {
  try {
    const records = await TemporaryPrincipalAccess.find()
      .populate("teacherId", "name email")
      .populate("grantedBy", "name")
      .populate("revokedBy", "name")
      .sort({ createdAt: -1 });
      
    // Update statuses dynamically
    const updatedRecords = await Promise.all(records.map(async (record) => {
      const currentStatus = record.getCurrentStatus();
      if (record.status !== currentStatus) {
        record.status = currentStatus;
        await record.save();
      }
      return record;
    }));

    res.json({ success: true, data: updatedRecords });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user's active temporary access
// @route   GET /api/temporary-principal-access/my-access
// @access  Private (Teacher)
const getMyAccess = async (req, res) => {
  try {
    const now = new Date();
    
    // Auto-update all records for this user first
    const records = await TemporaryPrincipalAccess.find({ teacherId: req.user._id, status: { $nin: ["Revoked", "Expired"] } });
    for (const record of records) {
      const currentStatus = record.getCurrentStatus();
      if (record.status !== currentStatus) {
        record.status = currentStatus;
        await record.save();
      }
    }

    const activeAccess = await TemporaryPrincipalAccess.findOne({
      teacherId: req.user._id,
      status: "Active",
      startAt: { $lte: now },
      expiresAt: { $gt: now }
    });

    res.json({ success: true, data: activeAccess });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get specific access record
// @route   GET /api/temporary-principal-access/:id
// @access  Private (Main Principal)
const getAccessRecord = async (req, res) => {
  try {
    const record = await TemporaryPrincipalAccess.findById(req.params.id)
      .populate("teacherId", "name email")
      .populate("grantedBy", "name")
      .populate("revokedBy", "name");
      
    if (!record) return res.status(404).json({ success: false, message: "Record not found" });

    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Revoke temporary access
// @route   PATCH /api/temporary-principal-access/:id/revoke
// @access  Private (Main Principal)
const revokeAccess = async (req, res) => {
  try {
    const record = await TemporaryPrincipalAccess.findById(req.params.id);
    
    if (!record) return res.status(404).json({ success: false, message: "Record not found" });
    if (record.status === "Revoked" || record.status === "Expired") {
      return res.status(400).json({ success: false, message: "Record is already revoked or expired" });
    }

    record.status = "Revoked";
    record.revokedAt = new Date();
    record.revokedBy = req.user._id;
    
    await record.save();

    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  grantAccess,
  getAllAccessRecords,
  getMyAccess,
  getAccessRecord,
  revokeAccess
};
