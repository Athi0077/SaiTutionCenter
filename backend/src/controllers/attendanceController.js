const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");
const AttendanceSession = require("../models/AttendanceSession");
const Class = require("../models/Class");
const TeacherAttendance = require("../models/TeacherAttendance");
const User = require("../models/User");
const Notification = require("../models/Notification");
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

// Helper to get total number of holidays between two dates (inclusive)
const getHolidayCount = async (startDate, endDate) => {
  const start = new Date(startDate);
  start.setHours(0,0,0,0);
  const end = new Date(endDate);
  end.setHours(23,59,59,999);
  
  let holidayCount = 0;
  
  // Count Sundays
  const current = new Date(start);
  while (current <= end) {
    if (current.getDay() === 0) holidayCount++;
    current.setDate(current.getDate() + 1);
  }
  
  // Count holidays in SchoolCalendar (excluding Sundays to avoid double counting)
  const startUTC = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
  const endUTC = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()));
  
  const holidays = await SchoolCalendar.find({
    date: { $gte: startUTC, $lte: endUTC },
    isHoliday: true
  });
  
  holidays.forEach(h => {
    if (new Date(h.date).getDay() !== 0) {
      holidayCount++;
    }
  });
  
  return holidayCount;
};


const { createNotification } = require("../services/notificationService");

// Helper to notify parents if child is absent
const notifyParentsIfAbsent = async (studentId, date, session = null, teacherId) => {
  try {
    const student = await User.findById(studentId);
    if (!student) return;

    const parents = await User.find({ role: 'parent', children: studentId });
    if (parents.length === 0) return;

    const dateStr = new Date(date).toLocaleDateString();
    const sessionText = session ? ` for the ${session.toLowerCase()} session` : '';

    for (const parent of parents) {
      await createNotification({
        recipientId: parent._id,
        senderId: teacherId,
        type: 'attendance',
        title: 'Absentee Alert',
        message: `${student.name} has been marked ABSENT on ${dateStr}${sessionText}.`,
        relatedId: student._id,
        relatedModel: 'User'
      });
    }
  } catch (err) {
    console.error("Error notifying parents:", err);
  }
};

// Helper to validate date (no unreasonable future date)
const isValidAttendanceDate = (dateString) => {
  const reqDate = new Date(dateString);
  const now = new Date();
  // Allow today and past dates, do not allow future dates (more than 1 day in future to handle timezones)
  reqDate.setHours(0,0,0,0);
  const maxAllowedDate = new Date();
  maxAllowedDate.setDate(maxAllowedDate.getDate() + 1);
  maxAllowedDate.setHours(0,0,0,0);
  return reqDate <= maxAllowedDate;
};

// @desc    Save attendance
// @route   POST /api/attendance
// @access  Private (Teacher only)
const saveAttendance = async (req, res) => {
  try {
    const { classId, date, attendance } = req.body;
    const teacherId = req.user._id;

    if (!isValidAttendanceDate(date)) {
      return res.status(400).json({ success: false, message: "Cannot mark attendance for a future date" });
    }
    
    if (await isHolidayDate(date)) {
      return res.status(400).json({ success: false, message: "Attendance cannot be marked on a holiday." });
    }

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    // Any active teacher can mark attendance for this class

    // Process attendance array
    const attendanceOps = attendance.map(item => {
      // Ensure student belongs to class
      if (!classData.students.includes(item.studentId)) {
        throw new Error(`Student ${item.studentId} does not belong to this class`);
      }
      
      if (item.status === 'absent') {
        notifyParentsIfAbsent(item.studentId, date, null, teacherId);
      }
      
      return {
        updateOne: {
          filter: { studentId: item.studentId, classId, date: new Date(date).setHours(0,0,0,0), session: "MORNING" },
          update: {
            $set: {
              status: item.status,
              markedBy: teacherId,
              markedAt: Date.now()
            }
          },
          upsert: true
        }
      };
    });

    if (attendanceOps.length > 0) {
      await Attendance.bulkWrite(attendanceOps);
    }

    res.status(200).json({ success: true, message: "Attendance saved successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Save session-wise attendance
// @route   POST /api/attendance/session
// @access  Private (Teacher only)
const saveSessionAttendance = async (req, res) => {
  try {
    const { classId, date, attendance } = req.body;
    const session = req.body.session || "DAILY";
    const teacherId = req.user._id;

    if (!isValidAttendanceDate(date)) {
      return res.status(400).json({ success: false, message: "Cannot mark attendance for a future date" });
    }
    
    if (await isHolidayDate(date)) {
      return res.status(400).json({ success: false, message: "Attendance cannot be marked on a holiday." });
    }

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    // Any teacher in the tuition/school can mark attendance for any class

    // Try to create the session record (Duplicate key error handled in catch)
    const newSession = await AttendanceSession.create({
      classId,
      attendanceDate: date,
      session,
      submittedBy: teacherId,
      records: attendance
    });

    // Sync to Daily Attendance collection for dashboard compatibility
    const attendanceOps = attendance.map(item => {
      if (item.status === 'absent') {
        notifyParentsIfAbsent(item.studentId, date, null, teacherId);
      }
      return {
        updateOne: {
          filter: { studentId: item.studentId, classId, date: new Date(date).setHours(0,0,0,0), session },
          update: {
            $set: {
              status: item.status,
              markedBy: teacherId,
              markedAt: Date.now()
            }
          },
          upsert: true
        }
      };
    });

    if (attendanceOps.length > 0) {
      await Attendance.bulkWrite(attendanceOps);
    }

    res.status(201).json({ success: true, message: "Attendance saved successfully", data: newSession });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Attendance has already been submitted for this class on this date." });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get session-wise attendance
// @route   GET /api/attendance/session/:classId
// @access  Private
const getSessionAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date, session } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: "Date is required" });
    }

    let filter = { classId, attendanceDate: date };
    if (session) {
      filter.session = session;
    }

    const sessionRecord = await AttendanceSession.findOne(filter)
      .sort({ createdAt: -1 })
      .populate("submittedBy", "name email")
      .populate("records.studentId", "name email");

    res.json({ success: true, data: sessionRecord });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Get class attendance for a specific date
// @route   GET /api/attendance/class/:classId
// @access  Private
const getClassAttendance = async (req, res) => {
  try {
    const { classId } = req.params;
    const dateStr = req.query.date;
    
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    // Any teacher can view class attendance

    let filter = { classId };
    if (dateStr) {
      const searchDate = new Date(dateStr);
      searchDate.setHours(0,0,0,0);
      filter.date = searchDate;
    }

    let records = await Attendance.find(filter)
      .populate("studentId", "name email rollNumber studentId profilePic")
      .sort({ date: -1 });

    if (records.length === 0 && dateStr) {
      const AttendanceSession = require("../models/AttendanceSession");
      const dateOnly = dateStr.split("T")[0];
      const sessionDoc = await AttendanceSession.findOne({ classId, attendanceDate: dateOnly })
        .populate("records.studentId", "name email rollNumber studentId profilePic");
      if (sessionDoc) {
        records = sessionDoc.records.map(r => ({
          _id: r._id,
          classId,
          studentId: r.studentId,
          status: r.status,
          date: new Date(sessionDoc.attendanceDate),
          markedBy: sessionDoc.submittedBy
        }));
      }
    }

    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student's own attendance
// @route   GET /api/attendance/my
// @access  Private (Student only)
const getStudentAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ studentId: req.user._id })
      .populate("classId", "className")
      .sort({ date: -1 });

    let present = 0;
    let absent = 0;
    let leave = 0;

    records.forEach(r => {
      if (r.status === "present") present++;
      if (r.status === "absent") absent++;
      if (r.status === "leave") leave++;
    });

    const totalCalculated = present + absent;
    
    // Calculate total working days based on actual records, skipping holiday records if any exist mistakenly
    // But since percentages are based on marked records (present + absent), totalCalculated acts as denominator.
    // If we want to strictly use working days as denominator: total working days = marked (present + absent + leave).
    // The requirement says: "Holiday dates must NOT be included in attendance calculations. 17/20"
    // present+absent is effectively the marked working days for that student, provided they aren't marked on holidays.
    // We already prevent marking on holidays. But let's assure calculation.
    
    const percentage = totalCalculated === 0 ? 0 : Math.round((present / totalCalculated) * 100);

    res.json({ 
      success: true, 
      data: {
        records,
        stats: {
          present,
          absent,
          leave,
          percentage
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update single attendance record
// @route   PATCH /api/attendance/:attendanceId
// @access  Private (Teacher only)
const updateAttendance = async (req, res) => {
  try {
    const { status } = req.body;
    const record = await Attendance.findById(req.params.attendanceId).populate("classId");
    
    if (!record) {
      return res.status(404).json({ success: false, message: "Attendance record not found" });
    }

    // Any teacher can update attendance

    record.status = status;
    record.markedBy = req.user._id;
    record.markedAt = Date.now();
    await record.save();

    if (status === 'absent') {
      notifyParentsIfAbsent(record.studentId, record.date, null, req.user._id);
    }

    res.json({ success: true, message: "Attendance updated", data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Principal Overview
// @route   GET /api/attendance/overview
// @access  Private (Principal only)
const getOverview = async (req, res) => {
  try {
    let searchDate = req.query.date;
    if (!searchDate) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      searchDate = `${yyyy}-${mm}-${dd}`;
    } else {
      searchDate = searchDate.split('T')[0];
    }

    const sessionRecords = await AttendanceSession.find({ attendanceDate: searchDate })
      .populate("classId")
      .populate("submittedBy", "name");
    
    const classSessionStatus = {};
    const studentStatusMap = new Map();

    sessionRecords.forEach(record => {
      let pCount = 0, aCount = 0, lCount = 0;
      record.records.forEach(r => {
        const sId = (r.studentId?._id || r.studentId)?.toString();
        if (sId) {
          if (!studentStatusMap.has(sId) || r.status === "present") {
            studentStatusMap.set(sId, r.status);
          }
        }

        // Calculate per-session/class stats to display in UI
        if (r.status === "present") pCount++;
        if (r.status === "absent") aCount++;
        if (r.status === "leave") lCount++;
      });

      const sessionData = {
        submittedBy: record.submittedBy?.name || 'Unknown',
        submittedAt: record.submittedAt,
        present: pCount,
        absent: aCount,
        leave: lCount,
        status: "Completed"
      };

      if (record.classId) {
        classSessionStatus[record.classId._id] = {
          classId: record.classId,
          daily: sessionData,
          morning: sessionData,
          afternoon: sessionData
        };
      }
    });

    let present = 0, absent = 0, leave = 0;
    studentStatusMap.forEach(status => {
      if (status === "present") present++;
      else if (status === "absent") absent++;
      else if (status === "leave") leave++;
    });

    // Also get total students count
    const User = require("../models/User");
    const totalStudents = await User.countDocuments({ role: "student", status: "active" });

    const eligibleStudentsForRate = Math.max(0, totalStudents - leave);
    const percentage = eligibleStudentsForRate === 0 && present === 0 
      ? 0 
      : eligibleStudentsForRate === 0 && present > 0
      ? 100
      : Math.round((present / eligibleStudentsForRate) * 100);

    res.json({
      success: true,
      data: {
        totalStudents,
        present,
        absent,
        leave,
        percentage,
        classSessions: Object.values(classSessionStatus)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get total attendance report (for charts)
// @route   GET /api/attendance/report/total
// @access  Private (Principal only)
const getTotalAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, classId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: "startDate and endDate are required" });
    }

    const start = new Date(startDate);
    start.setHours(0,0,0,0);
    const end = new Date(endDate);
    end.setHours(23,59,59,999);

    // Enforce Principal's school isolation
    const User = require("../models/User");
    const studentsInSchool = await User.find({ role: "student", schoolId: req.user.schoolId }).select("_id");
    const studentIds = studentsInSchool.map(s => s._id);

    // Build filter
    const matchFilter = {
      date: { $gte: start, $lte: end },
      studentId: { $in: studentIds }
    };

    if (req.query.session) {
      matchFilter.session = req.query.session;
    }

    if (classId) {
      matchFilter.classId = new mongoose.Types.ObjectId(classId);
    }

    const records = await Attendance.aggregate([
      { $match: matchFilter },
      { 
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "+05:30" } },
          presentCount: {
            $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] }
          },
          absentCount: {
            $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] }
          },
          leaveCount: {
            $sum: { $cond: [{ $eq: ["$status", "leave"] }, 1, 0] }
          },
          totalRecords: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const formattedData = records.map(r => {
      // Calculate percentage based on present vs total marked (eligible)
      // Including absent and leave as part of total eligible.
      const totalStudents = r.totalRecords;
      const attendancePercentage = totalStudents === 0 ? 0 : Number(((r.presentCount / totalStudents) * 100).toFixed(2));
      
      return {
        date: r._id,
        presentCount: r.presentCount,
        absentCount: r.absentCount,
        leaveCount: r.leaveCount,
        totalStudents,
        attendancePercentage
      };
    });

    res.json({ success: true, data: formattedData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark teacher own attendance (Present)
// @route   POST /api/attendance/teacher/mark
// @access  Private (Teacher)
const markTeacherAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (await isHolidayDate(today)) {
      return res.status(400).json({ success: false, message: "Attendance cannot be marked on a holiday." });
    }
    
    // Check if already marked
    const existing = await TeacherAttendance.findOne({ teacherId: req.user._id, date: today });
    if (existing) {
      return res.status(400).json({ success: false, message: "Attendance already marked for today" });
    }
    
    const record = await TeacherAttendance.create({
      teacherId: req.user._id,
      date: today,
      status: "present"
    });
    
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get teacher's today attendance status
// @route   GET /api/attendance/teacher/today
// @access  Private (Teacher)
const getTeacherTodayAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const record = await TeacherAttendance.findOne({ teacherId: req.user._id, date: today });
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all teachers' attendance for a specific date
// @route   GET /api/attendance/teacher/all
// @access  Private (Principal)
const getAllTeachersTodayAttendance = async (req, res) => {
  try {
    const dateStr = req.query.date;
    const searchDate = dateStr ? new Date(dateStr) : new Date();
    searchDate.setHours(0,0,0,0);
    
    const User = require("../models/User");
    const allTeachers = await User.find({ role: "teacher", status: "active" }).select("_id name email profilePic");
    
    const markedAttendances = await TeacherAttendance.find({ date: searchDate });
    
    const result = allTeachers.map(teacher => {
      const attendance = markedAttendances.find(a => a.teacherId.toString() === teacher._id.toString());
      return {
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        profilePic: teacher.profilePic,
        status: attendance ? attendance.status : "absent" // Default to absent if not marked
      };
    });
    
    res.json({ success: true, data: result, date: searchDate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get teacher's attendance history
// @route   GET /api/attendance/teacher/:id/history
// @access  Private (Principal)
const getTeacherAttendanceHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { month, year } = req.query; // optional, month is 1-12
    
    let filter = { teacherId: id };
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    }
    
    const records = await TeacherAttendance.find(filter).sort({ date: 1 });
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  saveAttendance,
  saveSessionAttendance,
  getSessionAttendance,
  getClassAttendance,
  getStudentAttendance,
  updateAttendance,
  getOverview,
  getTotalAttendanceReport,
  markTeacherAttendance,
  getTeacherTodayAttendance,
  getAllTeachersTodayAttendance,
  getTeacherAttendanceHistory,
};
