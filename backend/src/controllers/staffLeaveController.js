const StaffLeave = require("../models/StaffLeave");
const TeacherAttendance = require("../models/TeacherAttendance");
const SchoolCalendar = require("../models/SchoolCalendar");
const { createNotification } = require("../services/notificationService");

// Helper to check if a date is Sunday or a holiday
const isHolidayDate = async (dateString) => {
  const reqDate = new Date(dateString);
  // Sunday check
  if (reqDate.getDay() === 0) return true;
  
  // Check SchoolCalendar
  const dateObj = new Date(Date.UTC(reqDate.getFullYear(), reqDate.getMonth(), reqDate.getDate()));
  const holiday = await SchoolCalendar.findOne({ date: dateObj, isHoliday: true });
  return !!holiday;
};

// @desc    Create a new staff leave request
// @route   POST /api/staff-leave
// @access  Private (Teacher)
const createLeaveRequest = async (req, res) => {
  try {
    const { startDate, endDate, leaveType, reason } = req.body;
    const teacherId = req.user._id;

    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: "Please provide startDate, endDate, and reason" });
    }

    if (new Date(startDate).getTime() === new Date(endDate).getTime()) {
      if (await isHolidayDate(startDate)) {
        return res.status(400).json({ success: false, message: "Leave request is not required because this is a holiday." });
      }
    }

    const leaveRequest = await StaffLeave.create({
      teacherId,
      startDate,
      endDate,
      leaveType: leaveType || "Casual",
      reason,
      status: "Pending"
    });

    // Notify Principal (assume roles: principal)
    // Actually we could broadcast or just rely on Principal dashboard. We can find principals.
    const User = require("../models/User");
    const principals = await User.find({ role: "principal" });
    principals.forEach(p => {
      createNotification({
        recipientId: p._id,
        senderId: teacherId,
        type: "leave_request",
        title: "New Staff Leave Request",
        message: `${req.user.name} has requested leave from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}.`,
        relatedModel: "StaffLeave",
        relatedId: leaveRequest._id
      });
    });

    res.status(201).json({ success: true, data: leaveRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current teacher's leave requests
// @route   GET /api/staff-leave/my
// @access  Private (Teacher)
const getMyLeaveRequests = async (req, res) => {
  try {
    const leaves = await StaffLeave.find({ teacherId: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all staff leave requests
// @route   GET /api/staff-leave
// @access  Private (Principal)
const getAllLeaveRequests = async (req, res) => {
  try {
    const leaves = await StaffLeave.find()
      .populate("teacherId", "name email profilePic")
      .populate("approvedBy", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update staff leave status (Approve/Reject)
// @route   PUT /api/staff-leave/:id/status
// @access  Private (Principal)
const updateLeaveStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const leaveId = req.params.id;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const leave = await StaffLeave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ success: false, message: "Leave request not found" });
    }

    if (leave.status !== "Pending") {
      return res.status(400).json({ success: false, message: `Leave is already ${leave.status}` });
    }

    leave.status = status;
    leave.approvedBy = req.user._id;
    if (status === "Rejected") {
      leave.rejectionReason = rejectionReason;
    }

    await leave.save();

    // If approved, create TeacherAttendance records for the date range
    if (status === "Approved") {
      const start = new Date(leave.startDate);
      start.setHours(0,0,0,0);
      const end = new Date(leave.endDate);
      end.setHours(23,59,59,999);
      
      const dates = [];
      let current = new Date(start);
      while (current <= end) {
        if (!(await isHolidayDate(current))) {
          dates.push(new Date(current));
        }
        current.setDate(current.getDate() + 1);
      }

      for (const d of dates) {
        d.setHours(0,0,0,0);
        // Upsert teacher attendance
        await TeacherAttendance.findOneAndUpdate(
          { teacherId: leave.teacherId, date: d },
          { 
            status: "leave",
            markedBy: req.user._id,
            markedAt: Date.now()
          },
          { upsert: true, new: true }
        );
      }
    }

    // Notify the teacher
    createNotification({
      recipientId: leave.teacherId,
      senderId: req.user._id,
      type: "leave_status_update",
      title: `Leave Request ${status}`,
      message: `Your leave request from ${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()} has been ${status}.`,
      relatedModel: "StaffLeave",
      relatedId: leave._id
    });

    res.json({ success: true, message: `Leave ${status} successfully`, data: leave });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createLeaveRequest,
  getMyLeaveRequests,
  getAllLeaveRequests,
  updateLeaveStatus
};
