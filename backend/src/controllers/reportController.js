const Report = require("../models/Report");
const ReportMessage = require("../models/ReportMessage");
const User = require("../models/User");
const Class = require("../models/Class");
const Enrollment = require("../models/Enrollment");
const TeacherAssignment = require("../models/TeacherAssignment");
const Notification = require("../models/Notification");

// Create Report
exports.createReport = async (req, res) => {
  try {
    const { title, category, description, priority, relatedStudentId, classId, sectionId } = req.body;
    const reporterId = req.user.id;
    const reporterRole = req.user.role;
    const schoolId = req.user.schoolId;

    let assignedTo = null;
    let assignedRole = "principal";

    // Logic to determine assignedTo
    if (reporterRole === "student" || reporterRole === "parent") {
      let activeClassId = classId;
      
      // If student/parent didn't pass classId, try to find it via Enrollment
      if (!activeClassId) {
        const studentIdToUse = reporterRole === "student" ? reporterId : relatedStudentId;
        const enrollment = await Enrollment.findOne({ studentId: studentIdToUse, status: "Active" }).sort({ createdAt: -1 });
        if (enrollment) {
          activeClassId = enrollment.classId;
        }
      }

      if (category === "Teacher-Related Complaint") {
        // Route to principal directly
        const principal = await User.findOne({ role: "principal", schoolId });
        if (principal) assignedTo = principal._id;
      } else if (activeClassId) {
        // Find Class Teacher
        const classDoc = await Class.findById(activeClassId);
        if (classDoc && classDoc.teacherId) {
          assignedTo = classDoc.teacherId;
          assignedRole = "teacher";
        } else {
          // fallback to principal
          const principal = await User.findOne({ role: "principal", schoolId });
          if (principal) assignedTo = principal._id;
        }
      } else {
        const principal = await User.findOne({ role: "principal", schoolId });
        if (principal) assignedTo = principal._id;
      }
    } else if (reporterRole === "teacher") {
      // Teachers report to principal
      const principal = await User.findOne({ role: "principal", schoolId });
      if (principal) assignedTo = principal._id;
    }

    const report = new Report({
      title,
      category,
      description,
      priority: priority || "Normal",
      reporterId,
      reporterRole,
      relatedStudentId,
      classId,
      sectionId,
      assignedTo,
      assignedRole,
      schoolId,
      history: [{ oldStatus: null, newStatus: "SUBMITTED", changedBy: reporterId, reason: "Report Created" }]
    });

    await report.save();

    // Send notification
    if (assignedTo) {
      await Notification.create({
        recipientId: assignedTo,
        title: "New Report Submitted",
        message: `A new ${priority || 'Normal'} priority report has been assigned to you.`,
        type: "Report",
        relatedId: report._id,
        relatedModel: "Report"
      });
    }

    res.status(201).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Reports based on user role
exports.getReports = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    
    let query = {};
    if (role === "student" || role === "parent") {
      query = { reporterId: userId };
    } else if (role === "teacher") {
      // Teachers can see reports assigned to them OR reports they created
      query = { $or: [{ assignedTo: userId }, { reporterId: userId }] };
    } else if (role === "principal") {
      query = { schoolId: req.user.schoolId };
    }

    // Filters
    if (req.query.status) query.status = req.query.status;
    if (req.query.priority) query.priority = req.query.priority;
    if (req.query.category) query.category = req.query.category;

    const reports = await Report.find(query)
      .populate("reporterId", "name email")
      .populate("assignedTo", "name email role")
      .populate("relatedStudentId", "name")
      .populate("classId", "className")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Single Report
exports.getReportDetails = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("reporterId", "name email role profilePic")
      .populate("assignedTo", "name email role")
      .populate("relatedStudentId", "name")
      .populate("classId", "className")
      .populate("history.changedBy", "name role");

    if (!report) return res.status(404).json({ success: false, message: "Report not found" });

    // Authorization check
    if (req.user.role === "student" || req.user.role === "parent") {
      if (report.reporterId._id.toString() !== req.user.id.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
      }
    } else if (req.user.role === "teacher") {
      if (report.assignedTo?._id.toString() !== req.user.id.toString() && report.reporterId._id.toString() !== req.user.id.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
      }
    }

    const messagesQuery = { reportId: report._id };
    if (req.user.role === "student" || req.user.role === "parent") {
      messagesQuery.isInternalNote = false;
    }

    const messages = await ReportMessage.find(messagesQuery)
      .populate("senderId", "name role profilePic")
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, data: { report, messages } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Report Status/Assignment
exports.updateReport = async (req, res) => {
  try {
    const { status, assignedTo, priority } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: "Report not found" });

    // Only Teacher assigned or Principal can update
    if (req.user.role === "student" || req.user.role === "parent") {
      if (status !== "CLOSED") return res.status(403).json({ success: false, message: "Unauthorized to change this status" });
    }

    const oldStatus = report.status;
    let changed = false;
    let reason = "Status updated";

    if (status && status !== report.status) {
      report.status = status;
      changed = true;
    }
    if (priority && priority !== report.priority) {
      report.priority = priority;
    }
    if (assignedTo && assignedTo !== report.assignedTo?.toString() && req.user.role === "principal") {
      report.assignedTo = assignedTo;
      const newUser = await User.findById(assignedTo);
      report.assignedRole = newUser?.role || "teacher";
      reason = "Report Reassigned";
      changed = true;
    }

    if (changed) {
      report.history.push({
        oldStatus,
        newStatus: report.status,
        changedBy: req.user.id,
        reason
      });
      
      // Notify reporter
      await Notification.create({
        recipientId: report.reporterId,
        title: "Report Status Updated",
        message: `Your report ${report.reportId} status is now ${report.status}`,
        type: "Report",
        relatedId: report._id,
        relatedModel: "Report"
      });
    }

    await report.save();
    res.status(200).json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add Message
exports.addMessage = async (req, res) => {
  try {
    const { message, isInternalNote } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: "Report not found" });

    // Auth check similar to get
    if (req.user.role === "student" || req.user.role === "parent") {
      if (report.reporterId.toString() !== req.user.id.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
      }
    }

    const reportMessage = new ReportMessage({
      reportId: report._id,
      senderId: req.user.id,
      senderRole: req.user.role,
      message,
      isInternalNote: req.user.role === "student" || req.user.role === "parent" ? false : (isInternalNote || false)
    });

    await reportMessage.save();

    // Auto update status if a staff replies
    if (req.user.role !== "student" && req.user.role !== "parent" && report.status === "SUBMITTED") {
      report.status = "IN_PROGRESS";
      report.history.push({
        oldStatus: "SUBMITTED",
        newStatus: "IN_PROGRESS",
        changedBy: req.user.id,
        reason: "Staff replied to report"
      });
      await report.save();
    }

    // Notify counterpart
    const notifyUserId = (req.user.id.toString() === report.reporterId.toString()) ? report.assignedTo : report.reporterId;
    if (notifyUserId && !reportMessage.isInternalNote) {
      const roleStr = (req.user.id.toString() === report.reporterId.toString()) ? report.assignedRole : report.reporterRole;
      await Notification.create({
        recipientId: notifyUserId,
        title: "New Message on Report",
        message: `New reply on report ${report.reportId}`,
        type: "Report",
        relatedId: report._id,
        relatedModel: "Report"
      });
    }

    res.status(201).json({ success: true, data: reportMessage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
