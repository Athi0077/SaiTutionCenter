const AiIntervention = require("../models/AiIntervention");
const User = require("../models/User");
const ExamMark = require("../models/ExamMark");
const Attendance = require("../models/Attendance");
const Notification = require("../models/Notification");
const openRouterService = require("../services/openRouterService");

// Helper to fetch latest metrics
const fetchLatestMetrics = async (studentId) => {
  const examMarks = await ExamMark.find({ studentId }).populate("subjectId", "name");
  const attendance = await Attendance.find({ studentId });
  
  const validMarks = examMarks.filter(m => m.marksObtained != null && !m.isAbsent);
  const subjectMarks = {};
  validMarks.forEach(m => {
    if (m.subjectId) {
      if (!subjectMarks[m.subjectId.name]) subjectMarks[m.subjectId.name] = { total: 0, count: 0 };
      subjectMarks[m.subjectId.name].total += m.marksObtained;
      subjectMarks[m.subjectId.name].count += 1;
    }
  });

  const formattedSubjects = {};
  for (const [key, val] of Object.entries(subjectMarks)) {
    formattedSubjects[key] = Math.round(val.total / val.count);
  }

  const overallAvg = validMarks.length > 0 ? validMarks.reduce((a, b) => a + b.marksObtained, 0) / validMarks.length : 0;
  const attPct = attendance.length > 0 ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100) : 0;

  return {
    subjectMarks: formattedSubjects,
    overallAverage: Math.round(overallAvg),
    attendancePercentage: attPct
  };
};

exports.getDashboard = async (req, res) => {
  try {
    const interventions = await AiIntervention.find({}).populate("studentId", "name studentId classSection");
    
    let total = interventions.length;
    let improving = 0;
    let declining = 0;
    let noChange = 0;
    let requiresFollowUp = 0;

    const now = new Date();

    const enriched = interventions.map(inv => {
      // Logic for trends (assuming last review is latest)
      let trend = "stable";
      if (inv.reviews && inv.reviews.length > 0 && inv.baselineMetrics) {
        const baseAvg = inv.baselineMetrics.overallAverage || 0;
        const latestAvg = inv.reviews[inv.reviews.length - 1].snapshotMetrics.overallAverage || 0;
        if (latestAvg > baseAvg + 2) { trend = "improving"; improving++; }
        else if (latestAvg < baseAvg - 2) { trend = "declining"; declining++; }
        else { trend = "stable"; noChange++; }
      } else {
        noChange++;
      }

      if (inv.reviewDate && new Date(inv.reviewDate) < now && inv.status !== "Completed") {
        requiresFollowUp++;
      }

      return {
        _id: inv._id,
        student: inv.studentId,
        subjects: inv.subjects,
        status: inv.status,
        reviewDate: inv.reviewDate,
        trend,
        baseline: inv.baselineMetrics?.overallAverage || 0,
      };
    });

    res.json({
      success: true,
      data: {
        stats: { total, improving, declining, noChange, requiresFollowUp },
        interventions: enriched
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load progress dashboard" });
  }
};

exports.createIntervention = async (req, res) => {
  try {
    const { studentId, concern, improvementTarget, actionItems, reviewDate, subjects } = req.body;

    const baselineMetrics = await fetchLatestMetrics(studentId);

    const formattedActions = actionItems.map(item => ({ item, completed: false }));

    const inv = await AiIntervention.create({
      studentId,
      principalId: req.user._id,
      concern,
      improvementTarget,
      subjects,
      actionItems: formattedActions,
      reviewDate,
      baselineMetrics,
      status: "Planned"
    });

    res.json({ success: true, data: inv });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create intervention" });
  }
};

exports.getIntervention = async (req, res) => {
  try {
    const inv = await AiIntervention.findById(req.params.id).populate("studentId", "name studentId classSection profilePhoto");
    if (!inv) return res.status(404).json({ success: false, message: "Not found" });
    const latestMetrics = await fetchLatestMetrics(inv.studentId._id);
    res.json({ success: true, data: { intervention: inv, currentMetrics: latestMetrics } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch intervention" });
  }
};

exports.updateIntervention = async (req, res) => {
  try {
    const { status, actionItems, reviewDate } = req.body;
    const inv = await AiIntervention.findById(req.params.id);
    if (!inv) return res.status(404).json({ success: false, message: "Not found" });

    if (status) inv.status = status;
    if (reviewDate) inv.reviewDate = reviewDate;
    if (actionItems) inv.actionItems = actionItems;

    await inv.save();
    res.json({ success: true, data: inv });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update intervention" });
  }
};

exports.generateReview = async (req, res) => {
  try {
    const { principalNotes } = req.body;
    const inv = await AiIntervention.findById(req.params.id).populate("studentId", "name");
    if (!inv) return res.status(404).json({ success: false, message: "Not found" });

    const currentMetrics = await fetchLatestMetrics(inv.studentId._id);

    const aiPayload = {
      baseline: inv.baselineMetrics,
      current: currentMetrics,
      target: inv.improvementTarget,
      concern: inv.concern,
      actionItemsCompleted: inv.actionItems.filter(a => a.completed).length,
      actionItemsTotal: inv.actionItems.length
    };

    const prompt = `Review the student's progress based strictly on the provided JSON data comparing baseline metrics to current metrics. 
Data: ${JSON.stringify(aiPayload, null, 2)}`;
    
    const aiSummary = await openRouterService.generateChatAnswer(prompt, aiPayload, [{role: "system", content: "You are an AI tracking academic interventions. Summarize progress strictly comparing baseline vs current metrics. Format nicely in markdown with sections: Progress Summary, Target Achievement Status, Areas Still Requiring Attention, Suggested Next Steps."}]);

    inv.reviews.push({
      aiSummary,
      principalNotes,
      snapshotMetrics: currentMetrics,
      date: new Date()
    });

    if (inv.status === "Planned") inv.status = "In Progress";
    await inv.save();

    // Send Notification to Principal
    await Notification.create({
      recipientId: req.user._id,
      type: "INTERVENTION_REVIEW",
      title: "Intervention Review Recorded",
      message: `A progress review for ${inv.studentId.name} has been securely logged.`,
      relatedId: inv._id,
      relatedModel: "AiIntervention"
    });

    res.json({ success: true, data: inv });
  } catch (error) {
    console.error("AI Review Error:", error);
    res.status(500).json({ success: false, message: "Failed to generate AI review" });
  }
};
