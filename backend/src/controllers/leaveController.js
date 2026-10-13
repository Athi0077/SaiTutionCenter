const LeaveRequest = require("../models/LeaveRequest");
const Attendance = require("../models/Attendance");
const Class = require("../models/Class");
const SchoolCalendar = require("../models/SchoolCalendar");

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

// @desc    Student creates leave request
// @route   POST /api/leave-requests
// @access  Private (Student only)
const createLeaveRequest = async (req, res) => {
  try {
    const { date, reason } = req.body;
    const studentId = req.user._id;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Leave reason is required." });
    }

    const studentClass = await Class.findOne({ students: studentId });
    if (!studentClass) {
      return res.status(400).json({ success: false, message: "You don't belong to any class" });
    }

    const reqDate = new Date(date);
    reqDate.setHours(0,0,0,0);

    if (await isHolidayDate(date)) {
      return res.status(400).json({ success: false, message: "Leave request is not required because this is a holiday." });
    }

    const newRequest = await LeaveRequest.create({
      studentId,
      classId: studentClass._id,
      date: reqDate,
      reason
    });

    res.status(201).json({ success: true, message: "Leave request submitted", data: newRequest });

    const { createNotification } = require("../services/notificationService");
    createNotification({
      recipientId: studentClass.teacherId,
      senderId: studentId,
      type: "leave_requested",
      title: "New Leave Request",
      message: `${req.user.name} requested leave for ${new Date(date).toLocaleDateString()}.`,
      relatedId: newRequest._id,
      relatedModel: "LeaveRequest"
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "You already have a leave request for this date" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student's leave history
// @route   GET /api/leave-requests/my
// @access  Private (Student only)
const getMyLeaveRequests = async (req, res) => {
  try {
    const requests = await LeaveRequest.find({ studentId: req.user._id })
      .populate("reviewedBy", "name")
      .populate("classId", "className")
      .sort({ date: -1 });
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get teacher's leave requests
// @route   GET /api/leave-requests/teacher
// @access  Private (Teacher only)
const getTeacherLeaveRequests = async (req, res) => {
  try {
    const { getTeacherClasses } = require("../utils/teacherClassHelper");
    const teacherClasses = await getTeacherClasses(req.user._id, "_id");
    const classIds = teacherClasses.map(c => c._id);

    const { status } = req.query;
    const query = { classId: { $in: classIds } };

    if (status === "history") {
      query.status = { $in: ["approved", "rejected"] };
    } else if (status === "approved" || status === "rejected") {
      query.status = status;
    } else if (status === "all") {
      // no status filter
    } else {
      query.status = "pending";
    }

    const requests = await LeaveRequest.find(query)
      .populate("studentId", "name studentId email profilePic")
      .populate("classId", "className")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 });
      
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve leave
// @route   PATCH /api/leave-requests/:id/approve
// @access  Private (Teacher only)
const approveLeaveRequest = async (req, res) => {
  try {
    const request = await LeaveRequest.findById(req.params.id).populate("classId");
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    if (request.classId.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const comment = (req.body.comment || req.body.teacherComment || "").trim();

    request.status = "approved";
    request.reviewedBy = req.user._id;
    request.reviewedAt = Date.now();
    if (comment) {
      request.comment = comment;
    }
    await request.save();

    // Upsert attendance record to Leave
    await Attendance.updateOne(
      { studentId: request.studentId, classId: request.classId._id, date: request.date },
      {
        $set: {
          status: "leave",
          markedBy: req.user._id,
          leaveRequestId: request._id,
          markedAt: Date.now()
        }
      },
      { upsert: true }
    );

    res.json({ success: true, message: "Leave request approved", data: request });

    const noteText = comment ? ` Note: "${comment}"` : "";
    const { createNotification } = require("../services/notificationService");
    createNotification({
      recipientId: request.studentId,
      senderId: req.user._id,
      type: "leave_approved",
      title: "Leave Approved",
      message: `Your leave request for ${new Date(request.date).toLocaleDateString()} has been approved.${noteText}`,
      relatedId: request._id,
      relatedModel: "LeaveRequest"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject leave
// @route   PATCH /api/leave-requests/:id/reject
// @access  Private (Teacher only)
const rejectLeaveRequest = async (req, res) => {
  try {
    const request = await LeaveRequest.findById(req.params.id).populate("classId");
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    if (request.classId.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const comment = (req.body.comment || req.body.teacherComment || "").trim();

    request.status = "rejected";
    request.reviewedBy = req.user._id;
    request.reviewedAt = Date.now();
    if (comment) {
      request.comment = comment;
    }
    await request.save();

    res.json({ success: true, message: "Leave request rejected", data: request });

    const noteText = comment ? ` Note: "${comment}"` : "";
    const { createNotification } = require("../services/notificationService");
    createNotification({
      recipientId: request.studentId,
      senderId: req.user._id,
      type: "leave_rejected",
      title: "Leave Rejected",
      message: `Your leave request for ${new Date(request.date).toLocaleDateString()} has been rejected.${noteText}`,
      relatedId: request._id,
      relatedModel: "LeaveRequest"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createLeaveRequest,
  getMyLeaveRequests,
  getTeacherLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
};
