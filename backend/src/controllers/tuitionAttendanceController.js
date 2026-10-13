const TuitionAttendance = require("../models/TuitionAttendance");
const Section = require("../models/Section");

// @desc    Mark attendance for a batch session
// @route   POST /api/tuition-attendance
// @access  Private (Teacher)
const markAttendance = async (req, res) => {
  try {
    const { batchId, sessionId, date, students } = req.body;
    
    // students should be an array of { studentId, status }
    if (!batchId || !sessionId || !date || !students || !Array.isArray(students)) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const attendanceRecords = students.map((student) => ({
      studentId: student.studentId,
      batchId,
      sessionId,
      date: new Date(date),
      status: student.status,
      markedBy: req.user._id,
    }));

    // Remove existing records for this batch/session/date to avoid duplicates
    await TuitionAttendance.deleteMany({
      batchId,
      sessionId,
      date: new Date(date),
      studentId: { $in: students.map(s => s.studentId) }
    });

    const result = await TuitionAttendance.insertMany(attendanceRecords);

    res.json({ success: true, message: "Attendance marked successfully", data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get attendance for a batch session date
// @route   GET /api/tuition-attendance
// @access  Private
const getAttendance = async (req, res) => {
  try {
    const { batchId, sessionId, date, studentId } = req.query;
    let filter = {};
    
    if (batchId && batchId !== 'all') filter.batchId = batchId;
    if (sessionId) filter.sessionId = sessionId;
    if (date) {
        const queryDate = new Date(date);
        const nextDay = new Date(queryDate);
        nextDay.setDate(nextDay.getDate() + 1);
        filter.date = { $gte: queryDate, $lt: nextDay };
    }
    if (studentId) filter.studentId = studentId;
    
    if (req.user.role === 'student') {
        filter.studentId = req.user._id;
    } else if (req.user.role === 'parent') {
        const User = require("../models/User");
        const child = await User.findOne({ parentId: req.user._id, role: 'student' });
        if (child) filter.studentId = child._id;
    }

    let attendance = await TuitionAttendance.find(filter)
      .populate("studentId", "name rollNumber studentId profilePic")
      .populate("batchId", "name batchName")
      .populate("sessionId", "startTime endTime room subject")
      .populate("markedBy", "name");
      
    // If no records in TuitionAttendance, bridge with AttendanceSession (class attendance)
    if (attendance.length === 0 && date) {
      const AttendanceSession = require("../models/AttendanceSession");
      const Class = require("../models/Class");
      const dateStr = typeof date === "string" ? date.split("T")[0] : "";
      
      let sessionQuery = { attendanceDate: dateStr };
      if (batchId && batchId !== "all") {
        const matchingClasses = await Class.find({
          $or: [
            { _id: batchId },
            { sectionId: batchId }
          ]
        }).select("_id");
        if (matchingClasses.length > 0) {
          sessionQuery.classId = { $in: matchingClasses.map(c => c._id) };
        }
      }

      const sessionDocs = await AttendanceSession.find(sessionQuery)
        .populate("classId")
        .populate("submittedBy", "name")
        .populate({
          path: "records.studentId",
          select: "name rollNumber studentId profilePic parentId"
        });

      const fallbackRecords = [];
      sessionDocs.forEach(session => {
        (session.records || []).forEach(r => {
          if (!r.studentId) return;
          
          if (studentId && r.studentId._id?.toString() !== studentId.toString()) {
            return;
          }
          if (req.user.role === 'student' && r.studentId._id?.toString() !== req.user._id.toString()) {
            return;
          }

          fallbackRecords.push({
            _id: r._id,
            studentId: r.studentId,
            batchId: session.classId?.sectionId 
              ? { _id: session.classId.sectionId, name: session.classId.section || session.classId.className }
              : { _id: session.classId?._id, name: session.classId?.className || "Tuition" },
            sessionId: {
              startTime: session.session === "DAILY" ? "Daily" : session.session,
              endTime: "",
              subject: session.classId?.className || "Tuition"
            },
            status: r.status,
            markedBy: session.submittedBy,
            markedAt: session.submittedAt,
            date: new Date(session.attendanceDate)
          });
        });
      });

      if (fallbackRecords.length > 0) {
        attendance = fallbackRecords;
      }
    }

    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  markAttendance,
  getAttendance,
};
