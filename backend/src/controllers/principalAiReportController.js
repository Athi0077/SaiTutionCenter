const AiReport = require("../models/AiReport");
const User = require("../models/User");
const ExamMark = require("../models/ExamMark");
const Attendance = require("../models/Attendance");
const Homework = require("../models/Homework");
const HomeworkSubmission = require("../models/HomeworkSubmission");
const Class = require("../models/Class");
const openRouterService = require("../services/openRouterService");

// Get students list for reports
exports.getReportStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).select("name studentId classSection");
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch students" });
  }
};

// Get raw student data for report
exports.getStudentReportData = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await User.findById(studentId).select("name studentId classSection profilePhoto");
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const [examMarks, attendance, submissions, homeworks] = await Promise.all([
      ExamMark.find({ studentId }).populate("subjectId", "name"),
      Attendance.find({ studentId }),
      HomeworkSubmission.find({ studentId }),
      Homework.find() // Need to filter by classId later if possible
    ]);

    const validMarks = examMarks.filter(m => m.marksObtained != null && !m.isAbsent);
    const subjectMarks = validMarks.map(m => ({
      subject: m.subjectId ? m.subjectId.name : "Unknown",
      marks: m.marksObtained,
      maxMarks: m.maxMarks || 100 // Assuming 100 if not specified
    }));

    const totalMarks = subjectMarks.reduce((acc, curr) => acc + curr.marks, 0);
    const maxMarks = subjectMarks.reduce((acc, curr) => acc + curr.maxMarks, 0);
    const overallPercentage = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;

    const present = attendance.filter(a => a.status === "present").length;
    const totalDays = attendance.length;
    const attendancePercentage = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;

    res.json({
      success: true,
      data: {
        profile: student,
        academic: {
          subjectMarks,
          overallPercentage,
          totalMarks,
          maxMarks
        },
        attendance: {
          present,
          totalDays,
          percentage: attendancePercentage
        },
        homework: {
          submitted: submissions.length,
          // Since we don't strictly have homeworks scoped securely without class ID here, we just pass submissions.
          assigned: homeworks.length // approximate
        }
      }
    });
  } catch (error) {
    console.error("Student Report Data Error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch student report data" });
  }
};

// Generate AI Report Summary
exports.generateReportSummary = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { reportData } = req.body;
    
    // Validate report data
    if (!reportData) return res.status(400).json({ success: false, message: "Report data is required" });

    // Use openRouterService to generate summary
    const prompt = `Generate a comprehensive academic summary for this student based ONLY on the provided data. \n\nData:\n${JSON.stringify(reportData, null, 2)}`;
    
    // We can reuse the generateChatAnswer or create a specific method. Let's use the raw extract logic via a minimal chat call.
    const summary = await openRouterService.generateChatAnswer(prompt, reportData, [{role: "system", content: "You are an AI generating an Academic Student Report summary. Be professional, highlight strengths, note areas for improvement, and do not invent data."}]);

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error("AI Report Summary Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate report summary" });
  }
};

// Generate AI Improvement Plan
exports.generateImprovementPlan = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { reportData } = req.body;
    
    if (!reportData) return res.status(400).json({ success: false, message: "Report data is required" });

    const prompt = `Generate a 2-week personalized improvement plan for this student based ONLY on their academic weaknesses in the provided data. Provide practical, measurable learning objectives.\n\nData:\n${JSON.stringify(reportData, null, 2)}`;
    
    const plan = await openRouterService.generateChatAnswer(prompt, reportData, [{role: "system", content: "You are an AI generating an actionable Personalized Improvement Plan for a student. Be practical, structured (Week 1, Week 2), and strictly follow the student's actual performance data."}]);

    res.json({ success: true, data: plan });
  } catch (error) {
    console.error("AI Improvement Plan Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate improvement plan" });
  }
};

// Save and Approve Report
exports.approveReport = async (req, res) => {
  try {
    const { studentId, reportType, academicPeriod, verifiedMetrics, aiInsights } = req.body;
    
    const report = await AiReport.create({
      principalId: req.user._id,
      studentId,
      reportType,
      academicPeriod,
      verifiedMetrics,
      aiInsights,
      approved: true,
      approvedAt: new Date()
    });

    res.json({ success: true, data: report });
  } catch (error) {
    console.error("Approve Report Error:", error);
    res.status(500).json({ success: false, message: "Failed to save approved report" });
  }
};

// Get Report History
exports.getReport = async (req, res) => {
  try {
    const report = await AiReport.findOne({ _id: req.params.reportId, principalId: req.user._id }).populate("studentId", "name studentId classSection");
    if (!report) return res.status(404).json({ success: false, message: "Report not found" });
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch report" });
  }
};
