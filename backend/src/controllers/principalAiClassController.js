const User = require("../models/User");
const ExamMark = require("../models/ExamMark");
const Attendance = require("../models/Attendance");
const Homework = require("../models/Homework");
const HomeworkSubmission = require("../models/HomeworkSubmission");
const Class = require("../models/Class");
const openRouterService = require("../services/openRouterService");

// In-memory cache for Class AI analysis results
const aiClassAnalysisCache = new Map();

// Helper to calculate percentages
const calculatePercentage = (part, total) => (total > 0 ? Math.round((part / total) * 100) : 0);

// @desc    Get class analytics overview
// @route   GET /api/principal/ai/class-analytics/:classId
// @access  Private (Principal)
exports.getClassAnalytics = async (req, res) => {
  try {
    const { classId } = req.params;
    
    const targetClass = await Class.findById(classId).populate("students", "name studentId status").populate("subjects", "name code");
    if (!targetClass) return res.status(404).json({ success: false, message: "Class not found" });

    const studentIds = targetClass.students.map(s => s._id);
    const totalEnrolled = studentIds.length;

    // Exams
    const examMarks = await ExamMark.find({ studentId: { $in: studentIds } });
    const studentsWithExams = new Set(examMarks.map(m => m.studentId.toString())).size;
    
    const validMarks = examMarks.filter(m => m.marksObtained != null && !m.isAbsent);
    const overallAvg = validMarks.length > 0 
      ? validMarks.reduce((acc, curr) => acc + curr.marksObtained, 0) / validMarks.length 
      : 0;

    // Attendance
    const attendanceRecs = await Attendance.find({ classId });
    const presentCount = attendanceRecs.filter(a => a.status === "present").length;
    const avgAttendance = calculatePercentage(presentCount, attendanceRecs.length);

    // Homework
    const homeworks = await Homework.find({ classId });
    const homeworkIds = homeworks.map(hw => hw._id);
    const totalExpectedSubmissions = homeworks.length * totalEnrolled;
    const submissions = await HomeworkSubmission.find({ classId });
    const submissionPercentage = calculatePercentage(submissions.length, totalExpectedSubmissions);

    res.json({
      success: true,
      data: {
        totalEnrolled,
        studentsWithExams,
        classAveragePercentage: Math.round(overallAvg * 100) / 100,
        averageAttendance: avgAttendance,
        homeworkSubmissionPercentage: submissionPercentage,
      }
    });
  } catch (error) {
    console.error("Class Analytics Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch class analytics" });
  }
};

// @desc    Get subject-wise performance for class
// @route   GET /api/principal/ai/class-analytics/:classId/subjects
// @access  Private (Principal)
exports.getClassSubjects = async (req, res) => {
  try {
    const { classId } = req.params;
    
    const targetClass = await Class.findById(classId).populate("subjects", "name");
    if (!targetClass) return res.status(404).json({ success: false, message: "Class not found" });

    const studentIds = targetClass.students;
    const examMarks = await ExamMark.find({ studentId: { $in: studentIds } }).populate("subjectId", "name");

    const subjectData = {};
    examMarks.forEach(m => {
      if (m.subjectId && m.marksObtained != null && !m.isAbsent) {
        const subId = m.subjectId._id.toString();
        if (!subjectData[subId]) {
          subjectData[subId] = {
            id: subId,
            name: m.subjectId.name,
            totalMarks: 0,
            count: 0
          };
        }
        subjectData[subId].totalMarks += m.marksObtained;
        subjectData[subId].count += 1;
      }
    });

    const result = Object.values(subjectData).map(s => ({
      id: s.id,
      name: s.name,
      average: Math.round((s.totalMarks / s.count) * 100) / 100
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Class Subjects Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch class subjects" });
  }
};

// @desc    Get early warning system flags
// @route   GET /api/principal/ai/class-analytics/:classId/early-warnings
// @access  Private (Principal)
exports.getEarlyWarnings = async (req, res) => {
  try {
    const { classId } = req.params;
    const { markThreshold = 40, attendanceThreshold = 75, homeworkThreshold = 50 } = req.query;

    const targetClass = await Class.findById(classId).populate("students", "name studentId");
    if (!targetClass) return res.status(404).json({ success: false, message: "Class not found" });

    const studentIds = targetClass.students.map(s => s._id);

    // Fetch data concurrently
    const [examMarks, attendanceRecs, homeworks, submissions] = await Promise.all([
      ExamMark.find({ studentId: { $in: studentIds } }),
      Attendance.find({ classId, studentId: { $in: studentIds } }),
      Homework.find({ classId }),
      HomeworkSubmission.find({ classId })
    ]);

    const warnings = [];

    targetClass.students.forEach(student => {
      const sId = student._id.toString();
      const flags = [];

      // Academic check
      const sMarks = examMarks.filter(m => m.studentId.toString() === sId && m.marksObtained != null && !m.isAbsent);
      if (sMarks.length > 0) {
        const avg = sMarks.reduce((acc, curr) => acc + curr.marksObtained, 0) / sMarks.length;
        if (avg < markThreshold) {
          flags.push({
            type: "Academic",
            description: `Average marks (${Math.round(avg)}%) below threshold (${markThreshold}%)`,
            recommendation: "Academic support recommended"
          });
        }
      }

      // Attendance check
      const sAtt = attendanceRecs.filter(a => a.studentId.toString() === sId);
      if (sAtt.length > 0) {
        const present = sAtt.filter(a => a.status === "present").length;
        const attPct = calculatePercentage(present, sAtt.length);
        if (attPct < attendanceThreshold) {
          flags.push({
            type: "Attendance",
            description: `Attendance (${attPct}%) below threshold (${attendanceThreshold}%)`,
            recommendation: "Attendance follow-up suggested"
          });
        }
      }

      // Homework check
      if (homeworks.length > 0) {
        const sSubs = submissions.filter(s => s.studentId.toString() === sId).length;
        const hwPct = calculatePercentage(sSubs, homeworks.length);
        if (hwPct < homeworkThreshold) {
          flags.push({
            type: "Homework",
            description: `Homework completion (${hwPct}%) below threshold (${homeworkThreshold}%)`,
            recommendation: "Homework follow-up suggested"
          });
        }
      }

      if (flags.length > 0) {
        warnings.push({
          student: {
            id: student._id,
            name: student.name,
            identifier: student.studentId
          },
          flags
        });
      }
    });

    res.json({ success: true, data: warnings });
  } catch (error) {
    console.error("Early Warnings Error:", error);
    res.status(500).json({ success: false, message: "Failed to calculate early warnings" });
  }
};

// @desc    Generate AI Class Summary
// @route   POST /api/principal/ai/class-analytics/:classId/summary
// @access  Private (Principal)
exports.generateClassSummary = async (req, res) => {
  try {
    const { classId } = req.params;
    
    const targetClass = await Class.findById(classId).populate("students", "name").populate("subjects", "name");
    if (!targetClass) return res.status(404).json({ success: false, message: "Class not found" });

    // Cache check
    const cacheKey = `ai_class_summary_${classId}`;
    if (aiClassAnalysisCache.has(cacheKey)) {
      const cachedData = aiClassAnalysisCache.get(cacheKey);
      if (Date.now() - cachedData.timestamp < 3600000) { // 1 hr cache
        return res.json({ success: true, data: cachedData.result, cached: true });
      }
      aiClassAnalysisCache.delete(cacheKey);
    }

    const studentIds = targetClass.students.map(s => s._id);
    
    // Aggregate minimal stats
    const [examMarks, attendanceRecs, homeworks, submissions] = await Promise.all([
      ExamMark.find({ studentId: { $in: studentIds } }).populate("subjectId", "name").lean(),
      Attendance.find({ classId }).lean(),
      Homework.find({ classId }).lean(),
      HomeworkSubmission.find({ classId }).lean()
    ]);

    const validMarks = examMarks.filter(m => m.marksObtained != null && !m.isAbsent);
    const overallAvg = validMarks.length > 0 ? validMarks.reduce((a, b) => a + b.marksObtained, 0) / validMarks.length : 0;
    
    const presentCount = attendanceRecs.filter(a => a.status === "present").length;
    const avgAttendance = calculatePercentage(presentCount, attendanceRecs.length);
    
    const totalExpectedSubmissions = homeworks.length * studentIds.length;
    const submissionPercentage = calculatePercentage(submissions.length, totalExpectedSubmissions);

    const subjectAverages = {};
    validMarks.forEach(m => {
      if (m.subjectId) {
        const subName = m.subjectId.name;
        if (!subjectAverages[subName]) subjectAverages[subName] = { total: 0, count: 0 };
        subjectAverages[subName].total += m.marksObtained;
        subjectAverages[subName].count++;
      }
    });
    
    const formattedSubjects = Object.keys(subjectAverages).map(sub => ({
      subject: sub,
      average: Math.round((subjectAverages[sub].total / subjectAverages[sub].count) * 100) / 100
    }));

    const aiPayload = {
      className: `${targetClass.standard} ${targetClass.section}`,
      totalStudents: studentIds.length,
      overallAverage: Math.round(overallAvg),
      attendancePercentage: avgAttendance,
      homeworkCompletionPercentage: submissionPercentage,
      subjectPerformance: formattedSubjects,
      generatedAt: new Date().toISOString()
    };

    // System prompt override for Class
    const aiAnalysis = await openRouterService.analyzeClass(aiPayload);
    
    aiClassAnalysisCache.set(cacheKey, { timestamp: Date.now(), result: aiAnalysis });
    res.json({ success: true, data: aiAnalysis });

  } catch (error) {
    console.error("AI Class Summary Error:", error);
    if (error.message.includes("OpenRouter API key")) {
      return res.status(503).json({ success: false, message: "AI Summary is unavailable." });
    }
    if (error.message.includes("rate limit")) {
      return res.status(429).json({ success: false, message: "AI Summary is busy. Try again." });
    }
    res.status(500).json({ success: false, message: "Failed to generate AI Class Summary" });
  }
};

// @desc    Compare multiple classes
// @route   GET /api/principal/ai/class-analytics/compare
// @access  Private (Principal)
exports.compareClasses = async (req, res) => {
  try {
    const { classIds } = req.query; // Expecting comma-separated IDs
    if (!classIds) return res.status(400).json({ success: false, message: "classIds parameter is required" });

    const ids = classIds.split(",");
    const classes = await Class.find({ _id: { $in: ids } }).populate("students");

    const comparisonData = await Promise.all(classes.map(async (cls) => {
      const studentIds = cls.students.map(s => s._id);
      
      const examMarks = await ExamMark.find({ studentId: { $in: studentIds } }).populate("subjectId", "name");
      const validMarks = examMarks.filter(m => m.marksObtained != null && !m.isAbsent);
      const overallAvg = validMarks.length > 0 ? validMarks.reduce((a, b) => a + b.marksObtained, 0) / validMarks.length : 0;
      
      const subjectAverages = {};
      validMarks.forEach(m => {
        if (m.subjectId) {
          const subName = m.subjectId.name;
          if (!subjectAverages[subName]) subjectAverages[subName] = { total: 0, count: 0 };
          subjectAverages[subName].total += m.marksObtained;
          subjectAverages[subName].count++;
        }
      });
      const formattedSubjects = Object.keys(subjectAverages).map(sub => ({
        subject: sub,
        average: Math.round((subjectAverages[sub].total / subjectAverages[sub].count) * 100) / 100
      }));

      const attendanceRecs = await Attendance.find({ classId: cls._id });
      const avgAttendance = calculatePercentage(attendanceRecs.filter(a => a.status === "present").length, attendanceRecs.length);

      const homeworks = await Homework.find({ classId: cls._id });
      const totalExpectedSubmissions = homeworks.length * studentIds.length;
      const submissions = await HomeworkSubmission.find({ classId: cls._id });
      const submissionPercentage = calculatePercentage(submissions.length, totalExpectedSubmissions);

      return {
        id: cls._id,
        name: `${cls.standard} ${cls.section}`,
        enrolled: studentIds.length,
        averageMarks: Math.round(overallAvg * 100) / 100,
        averageAttendance: avgAttendance,
        homeworkSubmission: submissionPercentage,
        subjects: formattedSubjects
      };
    }));

    res.json({ success: true, data: comparisonData });
  } catch (error) {
    console.error("Class Comparison Error:", error);
    res.status(500).json({ success: false, message: "Failed to compare classes" });
  }
};
