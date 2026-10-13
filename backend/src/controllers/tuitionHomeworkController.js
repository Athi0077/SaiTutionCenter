const TuitionHomework = require("../models/TuitionHomework");
const TuitionHomeworkSubmission = require("../models/TuitionHomeworkSubmission");
const Section = require("../models/Section");
const { createNotification } = require("../services/notificationService");

const createHomework = async (req, res) => {
  try {
    const { title, description, batchId, subjectId, dueDate, sessionId, status } = req.body;
    
    const homework = new TuitionHomework({
      title,
      description,
      batchId,
      subjectId,
      teacherId: req.user._id,
      dueDate,
      sessionId,
      status: status || "published"
    });

    await homework.save();

    if (homework.status === "published") {
      const batch = await Section.findById(batchId);
      if (batch && batch.students) {
        for (const studentId of batch.students) {
          await createNotification({
            recipientId: studentId,
            senderId: req.user._id,
            type: "homework",
            title: "New Tuition Homework",
            message: `New homework assigned: ${title}`,
            relatedId: homework._id,
            relatedModel: "TuitionHomework"
          });
        }
      }
    }

    res.json({ success: true, message: "Homework created successfully", data: homework });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getHomework = async (req, res) => {
  try {
    const { batchId, subjectId, teacherId } = req.query;
    let filter = {};
    if (batchId) filter.batchId = batchId;
    if (subjectId) filter.subjectId = subjectId;
    if (teacherId) filter.teacherId = teacherId;

    const homework = await TuitionHomework.find(filter)
      .populate("batchId", "batchName")
      .populate("subjectId", "name")
      .populate("teacherId", "name");
      
    res.json({ success: true, data: homework });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const submitHomework = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentNote } = req.body;

    let submission = await TuitionHomeworkSubmission.findOne({
      homeworkId: id,
      studentId: req.user._id
    });

    if (submission) {
      submission.studentNote = studentNote;
      submission.status = "submitted";
      submission.submittedAt = new Date();
      await submission.save();
    } else {
      submission = new TuitionHomeworkSubmission({
        homeworkId: id,
        studentId: req.user._id,
        studentNote,
        status: "submitted",
        submittedAt: new Date()
      });
      await submission.save();
    }

    res.json({ success: true, message: "Homework submitted successfully", data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const gradeHomework = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, teacherRemarks } = req.body;

    const submission = await TuitionHomeworkSubmission.findById(submissionId);
    if (!submission) return res.status(404).json({ success: false, message: "Submission not found" });

    submission.grade = grade;
    submission.teacherRemarks = teacherRemarks;
    submission.status = "graded";
    await submission.save();

    res.json({ success: true, message: "Homework graded successfully", data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSubmissions = async (req, res) => {
  try {
    const { id } = req.params; // homeworkId
    const submissions = await TuitionHomeworkSubmission.find({ homeworkId: id })
      .populate("studentId", "name rollNumber");
      
    res.json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMySubmissions = async (req, res) => {
  try {
    let studentId = req.user._id;
    if (req.user.role === 'parent') {
        const User = require("../models/User");
        const child = await User.findOne({ parentId: req.user._id, role: 'student' });
        if (!child) return res.status(404).json({ success: false, message: "Child not found" });
        studentId = child._id;
    }
    
    const submissions = await TuitionHomeworkSubmission.find({ studentId })
      .populate("homeworkId", "title dueDate");
      
    res.json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createHomework,
  getHomework,
  submitHomework,
  gradeHomework,
  getSubmissions,
  getMySubmissions
};
