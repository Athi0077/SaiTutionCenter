const User = require("../models/User");
const ExamMark = require("../models/ExamMark");
const Attendance = require("../models/Attendance");
const Homework = require("../models/Homework");
const HomeworkSubmission = require("../models/HomeworkSubmission");
const Class = require("../models/Class");
const openRouterService = require("../services/openRouterService");

// In-memory cache for AI analysis results
const aiAnalysisCache = new Map();

// @desc    Get dashboard overview metrics
// @route   GET /api/principal/ai/overview
// @access  Private (Principal)
exports.getOverview = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: "student" });
    
    // Students with recorded exam results
    const uniqueStudentsWithExams = await ExamMark.distinct("studentId");
    const studentsWithExams = uniqueStudentsWithExams.length;
    
    // Overall exam average
    const allMarks = await ExamMark.aggregate([
      { $match: { marksObtained: { $exists: true, $ne: null } } },
      { $group: { _id: null, avgMarks: { $avg: "$marksObtained" } } }
    ]);
    const overallExamAverage = allMarks.length > 0 ? allMarks[0].avgMarks : 0;
    
    // Average attendance percentage
    const allAttendance = await Attendance.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } }
        }
      }
    ]);
    const avgAttendance = allAttendance.length > 0 && allAttendance[0].total > 0
      ? (allAttendance[0].present / allAttendance[0].total) * 100
      : 0;

    // Students requiring attention (less than 40% in exams)
    const studentsRequiringAttention = await ExamMark.aggregate([
      { $match: { marksObtained: { $lt: 40 } } },
      { $group: { _id: "$studentId" } },
      { $count: "count" }
    ]);
    const requiringAttentionCount = studentsRequiringAttention.length > 0 ? studentsRequiringAttention[0].count : 0;

    res.json({
      success: true,
      data: {
        totalStudents,
        studentsWithExams,
        overallExamAverage: Math.round(overallExamAverage * 100) / 100,
        averageAttendance: Math.round(avgAttendance * 100) / 100,
        studentsRequiringAttention: requiringAttentionCount
      }
    });
  } catch (error) {
    console.error("AI Overview Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch AI dashboard overview" });
  }
};

// @desc    Get searchable student list
// @route   GET /api/principal/ai/students
// @access  Private (Principal)
exports.getStudents = async (req, res) => {
  try {
    const { search, classId, sectionId, page = 1, limit = 10 } = req.query;
    
    const query = { role: "student" };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
        { grNumber: { $regex: search, $options: "i" } }
      ];
    }
    
    // If filtering by class, we need to find students in that class
    let targetStudents = [];
    if (classId) {
      const cls = await Class.findById(classId);
      if (cls) {
        targetStudents = cls.students;
        query._id = { $in: targetStudents };
      } else {
         return res.json({ success: true, data: [], pagination: { total: 0, pages: 0, page: 1, limit: 10 } });
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);
    
    const students = await User.find(query)
      .select("name email studentId grNumber profilePic role status")
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Attach basic stats for each student
    const enrichedStudents = await Promise.all(students.map(async (student) => {
      // Find class info
      const studentClass = await Class.findOne({ students: student._id }).select("className standard section");
      
      // Attendance
      const attendanceRecs = await Attendance.find({ studentId: student._id });
      const totalDays = attendanceRecs.length;
      const presentDays = attendanceRecs.filter(a => a.status === "present").length;
      const attPercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
      
      // Latest exam mark
      const latestMark = await ExamMark.findOne({ studentId: student._id })
        .sort({ createdAt: -1 })
        .populate("subjectId", "name");
        
      return {
        ...student,
        classInfo: studentClass ? `${studentClass.className} ${studentClass.section}` : "N/A",
        attendancePercentage: Math.round(attPercentage),
        latestExamPerformance: latestMark ? latestMark.marksObtained : "N/A",
      };
    }));

    res.json({
      success: true,
      data: enrichedStudents,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error("AI Students Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch student list" });
  }
};

// @desc    Get detailed student data for AI dashboard
// @route   GET /api/principal/ai/student/:studentId
// @access  Private (Principal)
exports.getStudentDetails = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const student = await User.findOne({ _id: studentId, role: "student" })
      .select("-password");
      
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    
    const studentClass = await Class.findOne({ students: studentId })
      .select("className standard section");
      
    // Academic Performance
    const examMarks = await ExamMark.find({ studentId })
      .populate("subjectId", "name code")
      .populate("examId", "title type date")
      .sort({ createdAt: -1 });
      
    // Subject wise strengths mapping
    let subjectMarks = {};
    examMarks.forEach(m => {
      if (m.subjectId && m.marksObtained != null) {
        const subName = m.subjectId.name;
        if (!subjectMarks[subName]) subjectMarks[subName] = [];
        subjectMarks[subName].push(m.marksObtained);
      }
    });
    
    // Attendance
    const attendanceRecs = await Attendance.find({ studentId });
    const totalWorkingDays = attendanceRecs.length;
    const daysPresent = attendanceRecs.filter(a => a.status === "present").length;
    const daysAbsent = attendanceRecs.filter(a => a.status === "absent").length;
    const attendancePercentage = totalWorkingDays > 0 ? (daysPresent / totalWorkingDays) * 100 : 0;
    
    // Homework
    const submissions = await HomeworkSubmission.find({ studentId });
    const assignedHomeworkCount = await Homework.countDocuments({ classId: studentClass ? studentClass._id : null });
    const submittedHomeworkCount = submissions.length;
    const submissionPercentage = assignedHomeworkCount > 0 ? (submittedHomeworkCount / assignedHomeworkCount) * 100 : 0;
    
    res.json({
      success: true,
      data: {
        profile: {
          id: student._id,
          name: student.name,
          admissionNumber: student.grNumber || student.studentId,
          profilePhoto: student.profilePic,
          classSection: studentClass ? `${studentClass.className} ${studentClass.section}` : "N/A"
        },
        academic: {
          marks: examMarks,
          subjectAverages: Object.keys(subjectMarks).map(sub => {
            const avg = subjectMarks[sub].reduce((a, b) => a + b, 0) / subjectMarks[sub].length;
            return { subject: sub, average: Math.round(avg * 100) / 100 };
          })
        },
        attendance: {
          totalWorkingDays,
          daysPresent,
          daysAbsent,
          percentage: Math.round(attendancePercentage * 100) / 100
        },
        homework: {
          assigned: assignedHomeworkCount,
          submitted: submittedHomeworkCount,
          pending: Math.max(0, assignedHomeworkCount - submittedHomeworkCount),
          percentage: Math.round(submissionPercentage * 100) / 100
        }
      }
    });
  } catch (error) {
    console.error("AI Student Details Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch student details" });
  }
};

// @desc    Generate AI analysis for a student
// @route   POST /api/principal/ai/student/:studentId/analyze
// @access  Private (Principal)
exports.analyzeStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // 1. Verify access & existence
    const student = await User.findOne({ _id: studentId, role: "student" }).select("name");
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    
    // 2. Cache check
    const cacheKey = `ai_analysis_${studentId}`;
    if (aiAnalysisCache.has(cacheKey)) {
      const cachedData = aiAnalysisCache.get(cacheKey);
      // Expire after 1 hour (3600000 ms)
      if (Date.now() - cachedData.timestamp < 3600000) {
        return res.json({ success: true, data: cachedData.result, cached: true });
      }
      aiAnalysisCache.delete(cacheKey);
    }
    
    // 3. Gather sanitized data for AI
    const examMarks = await ExamMark.find({ studentId })
      .populate("subjectId", "name")
      .populate("examId", "title")
      .lean();
      
    const simplifiedMarks = examMarks.map(m => ({
      exam: m.examId ? m.examId.title : 'Unknown',
      subject: m.subjectId ? m.subjectId.name : 'Unknown',
      marksObtained: m.marksObtained
    }));

    const attendanceRecs = await Attendance.find({ studentId });
    const totalWorkingDays = attendanceRecs.length;
    const daysPresent = attendanceRecs.filter(a => a.status === "present").length;
    const attendancePercentage = totalWorkingDays > 0 ? (daysPresent / totalWorkingDays) * 100 : 0;
    
    const studentClass = await Class.findOne({ students: studentId });
    const submissions = await HomeworkSubmission.find({ studentId });
    const assignedHomeworkCount = studentClass ? await Homework.countDocuments({ classId: studentClass._id }) : 0;
    
    const aiPayload = {
      studentName: student.name,
      academicPerformance: simplifiedMarks,
      attendance: {
        totalDays: totalWorkingDays,
        daysPresent: daysPresent,
        percentage: Math.round(attendancePercentage)
      },
      homework: {
        assigned: assignedHomeworkCount,
        submitted: submissions.length
      }
    };
    
    // 4. Call OpenRouter Service
    const aiAnalysis = await openRouterService.analyzeStudent(aiPayload);
    
    // 5. Store in cache
    aiAnalysisCache.set(cacheKey, { timestamp: Date.now(), result: aiAnalysis });
    
    res.json({ success: true, data: aiAnalysis });

  } catch (error) {
    console.error("AI Analysis Error:", error);
    
    const errorMessage = error?.message || String(error) || "";

    // Handle specific AI errors
    if (errorMessage.includes("OpenRouter API key")) {
      return res.status(503).json({ success: false, message: "AI Analysis is currently unavailable due to configuration issues." });
    }
    if (errorMessage.includes("credits exhausted") || errorMessage.includes("402")) {
      return res.status(402).json({ success: false, message: "OpenRouter AI credits are exhausted. Please check your OpenRouter account balance." });
    }
    if (errorMessage.includes("rate limit") || errorMessage.includes("429")) {
      return res.status(429).json({ success: false, message: "AI Analysis is currently busy. Please try again later." });
    }
    if (errorMessage.includes("timed out") || errorMessage.includes("AbortError")) {
      return res.status(504).json({ success: false, message: "AI Analysis took too long to respond. Please try again." });
    }
    
    // Remove the Debug: prefix for production
    res.status(500).json({ success: false, message: "Failed to generate AI analysis. Please check network connection." });
  }
};
