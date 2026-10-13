const AiConversation = require("../models/AiConversation");
const User = require("../models/User");
const Class = require("../models/Class");
const ExamMark = require("../models/ExamMark");
const Attendance = require("../models/Attendance");
const Homework = require("../models/Homework");
const HomeworkSubmission = require("../models/HomeworkSubmission");
const openRouterService = require("../services/openRouterService");

// Valid intents
const VALID_INTENTS = [
  "SCHOOL_ENROLLMENT_SUMMARY",
  "CLASS_PERFORMANCE_SUMMARY",
  "SUBJECT_PERFORMANCE",
  "CLASS_COMPARISON",
  "STUDENT_LOOKUP",
  "STUDENT_PERFORMANCE",
  "ATTENDANCE_SUMMARY",
  "LOW_ATTENDANCE_STUDENTS",
  "HOMEWORK_SUMMARY",
  "PENDING_HOMEWORK_STUDENTS",
  "ACADEMIC_TREND",
  "EARLY_WARNING_SUMMARY",
  "UNKNOWN"
];

// Controller for conversation CRUD
exports.getConversations = async (req, res) => {
  try {
    const convos = await AiConversation.find({ principalId: req.user._id }).sort({ updatedAt: -1 }).select("title updatedAt");
    res.json({ success: true, data: convos });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch conversations" });
  }
};

exports.createConversation = async (req, res) => {
  try {
    const convo = await AiConversation.create({ principalId: req.user._id, title: "New Conversation", messages: [] });
    res.json({ success: true, data: convo });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create conversation" });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const convo = await AiConversation.findOne({ _id: req.params.conversationId, principalId: req.user._id });
    if (!convo) return res.status(404).json({ success: false, message: "Conversation not found" });
    res.json({ success: true, data: convo });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch conversation" });
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    await AiConversation.findOneAndDelete({ _id: req.params.conversationId, principalId: req.user._id });
    res.json({ success: true, message: "Conversation deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete conversation" });
  }
};

exports.clearMessages = async (req, res) => {
  try {
    const convo = await AiConversation.findOneAndUpdate(
      { _id: req.params.conversationId, principalId: req.user._id },
      { messages: [] },
      { new: true }
    );
    res.json({ success: true, data: convo });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to clear messages" });
  }
};

// Main Chat Logic
exports.handleChat = async (req, res) => {
  try {
    const { conversationId, message } = req.body;
    if (!message || typeof message !== "string") return res.status(400).json({ success: false, message: "Invalid message" });

    let convo = null;
    if (conversationId) {
      convo = await AiConversation.findOne({ _id: conversationId, principalId: req.user._id });
      if (!convo) return res.status(404).json({ success: false, message: "Conversation not found" });
    } else {
      convo = await AiConversation.create({ principalId: req.user._id, title: message.substring(0, 30), messages: [] });
    }

    // Save user message
    convo.messages.push({ role: "user", content: message });
    await convo.save();

    // 1. Extract Intent
    const intentPayload = await openRouterService.extractIntent(message);
    const { intent, parameters } = intentPayload || {};

    let replyContent = "";

    if (!intent || intent === "UNKNOWN" || !VALID_INTENTS.includes(intent)) {
      replyContent = "I'm not sure how to answer that based on the school's records. Could you rephrase your question to focus on enrollment, attendance, academic performance, or early warnings?";
    } else {
      // 2. Execute Data Fetch based on Intent
      const dbData = await executeQuery(intent, parameters, req.user);
      
      // 3. Generate Natural Language Answer
      replyContent = await openRouterService.generateChatAnswer(message, dbData, convo.messages);
    }

    // Save assistant message
    convo.messages.push({ role: "assistant", content: replyContent });
    await convo.save();

    res.json({ success: true, data: { conversationId: convo._id, message: replyContent } });
  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ success: false, message: "AI Assistant failed to process request. Please try again." });
  }
};

// Deterministic query router
async function executeQuery(intent, parameters, user) {
  try {
    switch (intent) {
      case "SCHOOL_ENROLLMENT_SUMMARY": {
        const classes = await Class.find().populate("students");
        let total = 0;
        const byStandard = {};
        classes.forEach(c => {
          total += c.students.length;
          if (!byStandard[c.standard]) byStandard[c.standard] = 0;
          byStandard[c.standard] += c.students.length;
        });
        return { totalEnrolled: total, enrollmentByStandard: byStandard };
      }
      case "CLASS_PERFORMANCE_SUMMARY": {
        const { standard, section } = parameters || {};
        const query = {};
        if (standard) query.standard = new RegExp(standard, 'i');
        if (section) query.section = new RegExp(section, 'i');
        const classes = await Class.find(query).populate("students");
        if (classes.length === 0) return { error: "Class not found based on parameters." };
        
        const c = classes[0];
        const studentIds = c.students.map(s => s._id);
        const exams = await ExamMark.find({ studentId: { $in: studentIds } });
        const validMarks = exams.filter(e => e.marksObtained != null && !e.isAbsent);
        const avg = validMarks.length ? validMarks.reduce((a, b) => a + b.marksObtained, 0) / validMarks.length : 0;
        return { className: `${c.standard} ${c.section}`, averageMarks: avg, totalExamsEvaluated: validMarks.length };
      }
      case "ATTENDANCE_SUMMARY": {
        const attendance = await Attendance.find();
        const total = attendance.length;
        const present = attendance.filter(a => a.status === "present").length;
        return { overallAttendancePercentage: total ? (present / total) * 100 : 0 };
      }
      case "LOW_ATTENDANCE_STUDENTS": {
        // Find students with low attendance
        const attendance = await Attendance.find().populate("studentId", "name studentId");
        const studentAtt = {};
        attendance.forEach(a => {
          if (!a.studentId) return;
          const sId = a.studentId._id.toString();
          if (!studentAtt[sId]) studentAtt[sId] = { name: a.studentId.name, present: 0, total: 0 };
          studentAtt[sId].total++;
          if (a.status === "present") studentAtt[sId].present++;
        });
        const low = Object.values(studentAtt).filter(s => (s.present / s.total) < 0.75).map(s => ({ name: s.name, percentage: (s.present / s.total) * 100 }));
        return { lowAttendanceStudents: low.slice(0, 10), count: low.length, note: "Displaying top 10 results" };
      }
      case "EARLY_WARNING_SUMMARY": {
        return { message: "Early warning data is calculated on the Class Analytics dashboard. Overall school calculation requires heavy processing. Please specify a class." };
      }
      default:
        return { data: `Requested data for ${intent} is partially available. Ensure you specify standard/section.` };
    }
  } catch (err) {
    return { error: "Failed to retrieve data from the database." };
  }
}
