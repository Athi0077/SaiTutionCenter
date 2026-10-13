const Project = require("../models/Project");
const ProjectSubmission = require("../models/ProjectSubmission");
const Class = require("../models/Class");
const { createNotification } = require("../services/notificationService");

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Teacher)
const createProject = async (req, res) => {
  try {
    const { title, description, instructions, classId, subjectId, startDate, dueDate, maxMarks, attachments, status } = req.body;
    const teacherId = req.user._id;

    const classData = await Class.findById(classId);
    if (!classData || classData.teacherId.toString() !== teacherId.toString()) {
      return res.status(403).json({ success: false, message: "Class not found or unauthorized" });
    }

    const project = await Project.create({
      title,
      description,
      instructions,
      classId,
      subjectId,
      teacherId,
      startDate,
      dueDate,
      maxMarks,
      attachments: attachments || [],
      status: status || "draft",
      publishedAt: status === "published" ? Date.now() : null,
    });

    res.status(201).json({ success: true, message: "Project created", data: project });

    if (status === "published") {
      classData.students.forEach(studentId => {
        createNotification({
          recipientId: studentId,
          senderId: teacherId,
          type: "project_assigned",
          title: "New Project Assigned",
          message: `${title} has been assigned for ${classData.className}. Due: ${new Date(dueDate).toLocaleDateString()}`,
          relatedId: project._id,
          relatedModel: "Project"
        });
      });
      
      createNotification({
        recipientId: teacherId,
        senderId: teacherId,
        type: "project_created",
        title: "Project Published",
        message: `You successfully published project '${title}' for ${classData.className}.`,
        relatedId: project._id,
        relatedModel: "Project"
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get teacher's projects
// @route   GET /api/projects/teacher
// @access  Private (Teacher)
const getTeacherProjects = async (req, res) => {
  try {
    const projects = await Project.find({ teacherId: req.user._id })
      .populate("classId", "className")
      .populate("subjectId", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student's projects
// @route   GET /api/projects/student
// @access  Private (Student)
const getStudentProjects = async (req, res) => {
  try {
    const studentClass = await Class.findOne({ students: req.user._id });
    if (!studentClass) return res.json({ success: true, data: [] });

    const projects = await Project.find({ classId: studentClass._id, status: "published" })
      .populate("subjectId", "name")
      .populate("teacherId", "name")
      .sort({ dueDate: 1 });
      
    // Fetch submissions to attach status
    const submissions = await ProjectSubmission.find({ studentId: req.user._id });
    const formatted = projects.map(p => {
      const sub = submissions.find(s => s.projectId.toString() === p._id.toString());
      return {
        ...p.toObject(),
        submissionStatus: sub ? sub.status : null
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("classId", "className students")
      .populate("subjectId", "name")
      .populate("teacherId", "name");

    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit completion request (Student)
// @route   POST /api/projects/:id/submit
// @access  Private (Student)
const submitProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { answerText } = req.body || {};
    const studentId = req.user._id;

    const project = await Project.findById(id);
    if (!project || project.status !== "published") {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    let attachments = [];
    if (req.file) {
      attachments.push({
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        url: req.file.path,
        publicId: req.file.filename
      });
    }

    let submission = await ProjectSubmission.findOne({ projectId: id, studentId });
    if (submission) {
      if (submission.status === "pending_approval" || submission.status === "approved") {
        return res.status(400).json({ success: false, message: "Completion already requested" });
      }
      submission.status = "pending_approval";
      submission.submittedAt = Date.now();
      if (answerText) submission.answerText = answerText;
      if (attachments.length > 0) submission.attachments = attachments;
      await submission.save();
    } else {
      submission = await ProjectSubmission.create({
        projectId: id,
        studentId,
        classId: project.classId,
        submittedAt: Date.now(),
        status: "pending_approval",
        answerText: answerText || "",
        attachments
      });
    }

    res.status(201).json({ success: true, message: "Completion request sent", data: submission });

    createNotification({
      recipientId: project.teacherId,
      senderId: studentId,
      type: "project_completion_request",
      title: "Project Completion Request",
      message: `A student requested approval for ${project.title}`,
      relatedId: submission._id,
      relatedModel: "ProjectSubmission"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all project approvals for a teacher
// @route   GET /api/projects/submissions/approvals
// @access  Private (Teacher)
const getTeacherApprovals = async (req, res) => {
  try {
    const projects = await Project.find({ teacherId: req.user._id }).select('_id');
    const projectIds = projects.map(p => p._id);

    const submissions = await ProjectSubmission.find({ projectId: { $in: projectIds } })
      .populate("studentId", "name")
      .populate({
        path: "projectId",
        populate: [
          { path: "classId", select: "className" },
          { path: "subjectId", select: "name" }
        ]
      })
      .sort({ submittedAt: -1 });

    res.json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Review submission
// @route   PATCH /api/projects/submissions/:id/review
// @access  Private (Teacher)
const reviewSubmission = async (req, res) => {
  try {
    const { status, feedback } = req.body;
    const { id } = req.params;

    if (!["approved", "revision_required"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const submission = await ProjectSubmission.findById(id).populate("projectId");
    if (!submission || submission.projectId.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    submission.status = status;
    submission.feedback = feedback || "";
    submission.reviewedAt = Date.now();
    submission.reviewedBy = req.user._id;
    await submission.save();

    res.json({ success: true, message: `Project marked as ${status}` });

    const title = status === "approved" ? "Project Approved" : "Project Revision Required";
    createNotification({
      recipientId: submission.studentId,
      senderId: req.user._id,
      type: "project_reviewed",
      title,
      message: `Your project '${submission.projectId.title}' has been reviewed: ${title}`,
      relatedId: submission._id,
      relatedModel: "ProjectSubmission"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student's project submission history (for finding single submission status)
// @route   GET /api/projects/student/history
// @access  Private (Student)
const getStudentHistory = async (req, res) => {
  try {
    const submissions = await ProjectSubmission.find({ studentId: req.user._id });
    res.json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createProject,
  getTeacherProjects,
  getStudentProjects,
  getProjectById,
  submitProject,
  getTeacherApprovals,
  reviewSubmission,
  getStudentHistory
};
