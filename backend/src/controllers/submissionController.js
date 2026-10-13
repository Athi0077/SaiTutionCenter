const HomeworkSubmission = require("../models/HomeworkSubmission");
const Homework = require("../models/Homework");
const Class = require("../models/Class");

// @desc    Submit homework
// @route   POST /api/homework/:homeworkId/submit
// @access  Private (Student only)
const submitHomework = async (req, res) => {
  try {
    const { answerText } = req.body || {};
    const { homeworkId } = req.params;
    const studentId = req.user._id;

    const homework = await Homework.findById(homeworkId);
    if (!homework || homework.status !== "published") {
      return res.status(404).json({ success: false, message: "Homework not found or not published" });
    }

    const classData = await Class.findById(homework.classId);
    if (!classData.students.includes(studentId)) {
      return res.status(403).json({ success: false, message: "You do not belong to this class" });
    }

    const now = new Date();
    
    let attachments = [];
    if (req.file) {
      attachments.push({
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        url: req.file.path,
        publicId: req.file.filename
      });
    }
    
    let submission = await HomeworkSubmission.findOne({ homeworkId, studentId });
    if (submission) {
      if (submission.status === "pending_approval" || submission.status === "approved") {
        return res.status(400).json({ success: false, message: "You have already submitted this completion request" });
      }
      
      // Update existing submission if revision was required
      submission.status = "pending_approval";
      submission.submittedAt = now;
      if (answerText) submission.answerText = answerText;
      if (attachments.length > 0) submission.attachments = attachments;
      await submission.save();
    } else {
      submission = await HomeworkSubmission.create({
        homeworkId,
        studentId,
        classId: homework.classId,
        submittedAt: now,
        status: "pending_approval",
        answerText: answerText || "",
        attachments
      });
    }

    res.status(201).json({ success: true, message: "Completion request sent successfully", data: submission });
    
    // Notify teacher
    const { createNotification } = require("../services/notificationService");
    createNotification({
      recipientId: homework.teacherId,
      senderId: studentId,
      type: "homework_completion_request",
      title: "Homework Completion Request",
      message: `A student has requested completion approval for ${homework.title}`,
      relatedId: submission._id,
      relatedModel: "HomeworkSubmission"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get submissions for a specific homework
// @route   GET /api/homework/:homeworkId/submissions
// @access  Private (Teacher only)
const getHomeworkSubmissions = async (req, res) => {
  try {
    const { homeworkId } = req.params;
    
    const homework = await Homework.findById(homeworkId);
    if (!homework) {
      return res.status(404).json({ success: false, message: "Homework not found" });
    }

    if (homework.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const submissions = await HomeworkSubmission.find({ homeworkId })
      .populate("studentId", "name email");

    res.json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Review a submission
// @route   PATCH /api/submissions/:submissionId/review
// @access  Private (Teacher only)
const reviewSubmission = async (req, res) => {
  try {
    const { status, feedback } = req.body;
    const { submissionId } = req.params;

    if (!["approved", "revision_required"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const submission = await HomeworkSubmission.findById(submissionId).populate("homeworkId");
    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    if (submission.homeworkId.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    submission.status = status;
    submission.feedback = feedback || "";
    submission.reviewedAt = Date.now();
    submission.reviewedBy = req.user._id;

    await submission.save();

    res.json({ success: true, message: `Submission marked as ${status}`, data: submission });

    const { createNotification } = require("../services/notificationService");
    const title = status === "approved" ? "Homework Approved" : "Homework Revision Required";
    createNotification({
      recipientId: submission.studentId,
      senderId: req.user._id,
      type: "homework_reviewed",
      title,
      message: `Your homework '${submission.homeworkId.title}' has been reviewed: ${title}`,
      relatedId: submission._id,
      relatedModel: "HomeworkSubmission"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student submission history
// @route   GET /api/homework/student/history
// @access  Private (Student only)
const getStudentHistory = async (req, res) => {
  try {
    const submissions = await HomeworkSubmission.find({ studentId: req.user._id })
      .populate({
        path: "homeworkId",
        populate: { path: "subjectId", select: "name" }
      })
      .sort({ submittedAt: -1 });
    res.json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get submission by ID
// @route   GET /api/submissions/:submissionId
// @access  Private
const getSubmissionById = async (req, res) => {
  try {
    const submission = await HomeworkSubmission.findById(req.params.submissionId)
      .populate("studentId", "name email")
      .populate({
        path: "homeworkId",
        populate: { path: "classId" }
      });
      
    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    // Role check
    if (req.user.role === "teacher" && submission.homeworkId.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    if (req.user.role === "student" && submission.studentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all homework approvals for a teacher
// @route   GET /api/homework/submissions/approvals
// @access  Private (Teacher only)
const getTeacherApprovals = async (req, res) => {
  try {
    const homeworks = await Homework.find({ teacherId: req.user._id }).select('_id');
    const homeworkIds = homeworks.map(hw => hw._id);

    const submissions = await HomeworkSubmission.find({ homeworkId: { $in: homeworkIds } })
      .populate("studentId", "name")
      .populate({
        path: "homeworkId",
        populate: [
          { path: "classId", select: "standard section className" },
          { path: "subjectId", select: "name" }
        ]
      })
      .sort({ submittedAt: -1 });

    res.json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  submitHomework,
  getHomeworkSubmissions,
  reviewSubmission,
  getStudentHistory,
  getSubmissionById,
  getTeacherApprovals,
};
