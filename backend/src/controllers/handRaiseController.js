const HandRaise = require("../models/HandRaise");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { getIo } = require("../utils/socket");

// Helper to send notification
const sendNotification = async (recipientId, title, message, relatedId, relatedModel = "HandRaise") => {
  try {
    const notification = await Notification.create({
      recipientId,
      type: "HandRaise",
      title,
      message,
      relatedId,
      relatedModel,
    });
    
    try {
      const io = getIo();
      io.to(`user:${recipientId}`).emit("new_notification", notification);
    } catch (socketErr) {
      console.log("Socket emit failed, user might be offline");
    }
  } catch (err) {
    console.error("Failed to create notification:", err);
  }
};

// @desc    Create a Hand Raise Request
// @route   POST /api/hand-raises
// @access  Private
const createHandRaise = async (req, res) => {
  try {
    const { targetUserId, studentId, topic, category, message, priority } = req.body;
    
    if (!targetUserId || !topic || !category || !message) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "Target user not found" });
    }

    let validStudentId = null;
    if (studentId) {
      const student = await User.findById(studentId);
      if (student) {
        validStudentId = student._id;
      }
    }

    const handRaise = await HandRaise.create({
      raisedBy: req.user._id,
      raisedByRole: req.user.role,
      targetUser: targetUser._id,
      targetRole: targetUser.role,
      student: validStudentId,
      topic,
      category,
      message,
      priority: priority || "Normal",
      status: "PENDING"
    });

    const populatedHR = await HandRaise.findById(handRaise._id)
      .populate("raisedBy", "name role")
      .populate("student", "name");

    const studentText = populatedHR.student ? ` regarding ${populatedHR.student.name}` : "";
    await sendNotification(
      targetUser._id,
      "🙋 New Hand Raise Request",
      `New request from ${populatedHR.raisedBy.name}${studentText}. Topic: ${topic}`,
      handRaise._id
    );

    res.status(201).json({ success: true, data: handRaise });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get My Hand Raises
// @route   GET /api/hand-raises/my
// @access  Private
const getMyHandRaises = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = { raisedBy: req.user._id };

    if (req.query.status) {
      query.status = req.query.status;
    }

    const handRaises = await HandRaise.find(query)
      .populate("targetUser", "name role profilePic")
      .populate("student", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await HandRaise.countDocuments(query);

    res.json({
      success: true,
      data: handRaises,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Received Hand Raises
// @route   GET /api/hand-raises/received
// @access  Private
const getReceivedHandRaises = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = { targetUser: req.user._id };

    if (req.query.status) {
      query.status = req.query.status;
    }

    const handRaises = await HandRaise.find(query)
      .populate("raisedBy", "name role profilePic")
      .populate("student", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await HandRaise.countDocuments(query);

    res.json({
      success: true,
      data: handRaises,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Hand Raise By ID
// @route   GET /api/hand-raises/:id
// @access  Private
const getHandRaiseById = async (req, res) => {
  try {
    const handRaise = await HandRaise.findById(req.params.id)
      .populate("raisedBy", "name role profilePic")
      .populate("targetUser", "name role profilePic")
      .populate("student", "name")
      .populate("responseBy", "name role")
      .populate("scheduledBy", "name role");

    if (!handRaise) {
      return res.status(404).json({ success: false, message: "Hand raise not found" });
    }

    // Verify access
    if (handRaise.raisedBy._id.toString() !== req.user._id.toString() &&
        handRaise.targetUser._id.toString() !== req.user._id.toString() &&
        req.user.role !== "superadmin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.json({ success: true, data: handRaise });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark as Viewed
// @route   PUT /api/hand-raises/:id/view
// @access  Private
const markAsViewed = async (req, res) => {
  try {
    const handRaise = await HandRaise.findById(req.params.id);
    if (!handRaise) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    if (handRaise.targetUser.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (handRaise.status === "PENDING") {
      handRaise.status = "VIEWED";
      handRaise.viewedAt = new Date();
      await handRaise.save();

      await sendNotification(
        handRaise.raisedBy,
        "👀 Hand Raise Viewed",
        `Your request regarding '${handRaise.topic}' has been viewed.`,
        handRaise._id
      );
    }

    res.json({ success: true, data: handRaise });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add Response
// @route   PUT /api/hand-raises/:id/respond
// @access  Private
const addResponse = async (req, res) => {
  try {
    const { responseMessage } = req.body;
    if (!responseMessage) {
      return res.status(400).json({ success: false, message: "Response message is required" });
    }

    const handRaise = await HandRaise.findById(req.params.id);
    if (!handRaise) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    if (handRaise.targetUser.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    handRaise.responseMessage = responseMessage;
    handRaise.responseBy = req.user._id;
    if (handRaise.status === "PENDING") {
      handRaise.status = "VIEWED";
      handRaise.viewedAt = new Date();
    }
    await handRaise.save();

    await sendNotification(
      handRaise.raisedBy,
      "💬 New Response",
      `You received a response for '${handRaise.topic}'.`,
      handRaise._id
    );

    res.json({ success: true, data: handRaise });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Schedule Meeting
// @route   PUT /api/hand-raises/:id/schedule
// @access  Private
const scheduleMeeting = async (req, res) => {
  try {
    const { scheduledDate, scheduledTime, duration, meetingType, location, meetingLink, message } = req.body;
    
    if (!scheduledDate || !scheduledTime || !duration || !meetingType) {
      return res.status(400).json({ success: false, message: "Missing schedule details" });
    }

    const handRaise = await HandRaise.findById(req.params.id);
    if (!handRaise) return res.status(404).json({ success: false, message: "Not found" });

    if (handRaise.targetUser.toString() !== req.user._id.toString() && handRaise.raisedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    handRaise.status = "SCHEDULED";
    handRaise.scheduledBy = req.user._id;
    handRaise.scheduledDate = scheduledDate;
    handRaise.scheduledTime = scheduledTime;
    handRaise.duration = duration;
    handRaise.meetingType = meetingType;
    handRaise.location = location || "";
    handRaise.meetingLink = meetingLink || "";
    if (message) {
      handRaise.responseMessage = message;
      handRaise.responseBy = req.user._id;
    }
    await handRaise.save();

    const notifyUserId = handRaise.targetUser.toString() === req.user._id.toString() ? handRaise.raisedBy : handRaise.targetUser;

    await sendNotification(
      notifyUserId,
      "📅 Meeting Scheduled",
      `A meeting has been scheduled for '${handRaise.topic}' on ${new Date(scheduledDate).toLocaleDateString()} at ${scheduledTime}.`,
      handRaise._id
    );

    res.json({ success: true, data: handRaise });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reschedule Meeting
// @route   PUT /api/hand-raises/:id/reschedule
// @access  Private
const rescheduleMeeting = async (req, res) => {
  try {
    const { scheduledDate, scheduledTime, duration, meetingType, location, meetingLink } = req.body;
    const handRaise = await HandRaise.findById(req.params.id);
    if (!handRaise) return res.status(404).json({ success: false, message: "Not found" });

    handRaise.scheduledDate = scheduledDate || handRaise.scheduledDate;
    handRaise.scheduledTime = scheduledTime || handRaise.scheduledTime;
    handRaise.duration = duration || handRaise.duration;
    handRaise.meetingType = meetingType || handRaise.meetingType;
    handRaise.location = location !== undefined ? location : handRaise.location;
    handRaise.meetingLink = meetingLink !== undefined ? meetingLink : handRaise.meetingLink;
    handRaise.scheduledBy = req.user._id;
    await handRaise.save();

    const notifyUserId = handRaise.targetUser.toString() === req.user._id.toString() ? handRaise.raisedBy : handRaise.targetUser;
    await sendNotification(
      notifyUserId,
      "📅 Meeting Rescheduled",
      `The meeting for '${handRaise.topic}' has been rescheduled to ${new Date(handRaise.scheduledDate).toLocaleDateString()} at ${handRaise.scheduledTime}.`,
      handRaise._id
    );

    res.json({ success: true, data: handRaise });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel Request / Meeting
// @route   PUT /api/hand-raises/:id/cancel
// @access  Private
const cancelMeeting = async (req, res) => {
  try {
    const { reason } = req.body;
    const handRaise = await HandRaise.findById(req.params.id);
    if (!handRaise) return res.status(404).json({ success: false, message: "Not found" });

    if (handRaise.targetUser.toString() !== req.user._id.toString() && handRaise.raisedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    handRaise.status = "CANCELLED";
    handRaise.cancelledAt = new Date();
    handRaise.cancellationReason = reason || "No reason provided";
    await handRaise.save();

    const notifyUserId = handRaise.targetUser.toString() === req.user._id.toString() ? handRaise.raisedBy : handRaise.targetUser;
    await sendNotification(
      notifyUserId,
      "❌ Meeting/Request Cancelled",
      `The request '${handRaise.topic}' has been cancelled.`,
      handRaise._id
    );

    res.json({ success: true, data: handRaise });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Complete Request
// @route   PUT /api/hand-raises/:id/complete
// @access  Private
const completeHandRaise = async (req, res) => {
  try {
    const handRaise = await HandRaise.findById(req.params.id);
    if (!handRaise) return res.status(404).json({ success: false, message: "Not found" });

    if (handRaise.targetUser.toString() !== req.user._id.toString() && handRaise.raisedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    handRaise.status = "COMPLETED";
    handRaise.completedAt = new Date();
    await handRaise.save();

    const notifyUserId = handRaise.targetUser.toString() === req.user._id.toString() ? handRaise.raisedBy : handRaise.targetUser;
    await sendNotification(
      notifyUserId,
      "✅ Request Completed",
      `The request '${handRaise.topic}' has been marked as completed.`,
      handRaise._id
    );

    res.json({ success: true, data: handRaise });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Stats for Dashboards
// @route   GET /api/hand-raises/stats
// @access  Private
const getStats = async (req, res) => {
  try {
    const role = req.user.role;
    let query = {};
    if (role === "student" || role === "parent") {
      query.raisedBy = req.user._id;
    } else {
      query.targetUser = req.user._id;
    }

    const stats = await HandRaise.aggregate([
      { $match: query },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const result = {
      PENDING: 0,
      VIEWED: 0,
      SCHEDULED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      total: 0
    };

    stats.forEach(stat => {
      result[stat._id] = stat.count;
      result.total += stat.count;
    });

    const urgentCount = await HandRaise.countDocuments({ ...query, priority: { $in: ["High", "Urgent"] }, status: { $in: ["PENDING", "VIEWED"] } });
    result.urgent = urgentCount;
    result.newRequests = result.PENDING;

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Target Users for Hand Raise
// @route   GET /api/hand-raises/targets
// @access  Private
const getTargetUsers = async (req, res) => {
  try {
    const role = req.user.role;
    let targets = [];

    if (role === "student" || role === "parent") {
      // Students and parents can raise hand to teachers and principal
      const teachers = await User.find({ role: "teacher", status: "active" }).select("name role profilePic");
      const principal = await User.findOne({ role: "principal", status: "active" }).select("name role profilePic");
      targets = [...teachers];
      if (principal) targets.push(principal);
    } else if (role === "teacher") {
      // Teachers can raise hand to principal
      const principal = await User.findOne({ role: "principal", status: "active" }).select("name role profilePic");
      if (principal) targets.push(principal);
      // Depending on permissions, teachers can raise to parents too (fetch parents of their students)
      // For now, let's keep it simple or fetch all parents if needed
    } else if (role === "principal") {
      // Principal can raise to teachers and parents
      const teachers = await User.find({ role: "teacher", status: "active" }).select("name role profilePic");
      targets = [...teachers];
    }

    res.json({ success: true, data: targets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createHandRaise,
  getMyHandRaises,
  getReceivedHandRaises,
  getHandRaiseById,
  markAsViewed,
  addResponse,
  scheduleMeeting,
  rescheduleMeeting,
  cancelMeeting,
  completeHandRaise,
  getStats,
  getTargetUsers
};
