const Test = require("../models/Test");
const TestSubmission = require("../models/TestSubmission");
const Class = require("../models/Class");
const { createNotification } = require("../services/notificationService");

// @desc    Create new test
// @route   POST /api/tests
// @access  Private (Teacher)
const createTest = async (req, res) => {
  try {
    const { title, description, classId, subjectId, testDate, durationMinutes, maxMarks, status } = req.body;
    const teacherId = req.user._id;

    const classData = await Class.findById(classId);
    if (!classData || classData.teacherId.toString() !== teacherId.toString()) {
      return res.status(403).json({ success: false, message: "Class not found or unauthorized" });
    }

    const test = await Test.create({
      title,
      description,
      classId,
      subjectId,
      teacherId,
      testDate,
      durationMinutes,
      maxMarks,
      status: status || "draft",
      publishedAt: status === "published" ? Date.now() : null,
    });

    res.status(201).json({ success: true, message: "Test created", data: test });

    if (status === "published") {
      classData.students.forEach(studentId => {
        createNotification({
          recipientId: studentId,
          senderId: teacherId,
          type: "test_assigned",
          title: "New Test Assigned",
          message: `${title} has been scheduled for ${classData.className} on ${new Date(testDate).toLocaleDateString()}`,
          relatedId: test._id,
          relatedModel: "Test"
        });
      });
      
      createNotification({
        recipientId: teacherId,
        senderId: teacherId,
        type: "test_created",
        title: "Test Published",
        message: `You successfully published test '${title}' for ${classData.className}.`,
        relatedId: test._id,
        relatedModel: "Test"
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get teacher's tests
// @route   GET /api/tests/teacher
// @access  Private (Teacher)
const getTeacherTests = async (req, res) => {
  try {
    const tests = await Test.find({ teacherId: req.user._id })
      .populate("classId", "className")
      .populate("subjectId", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: tests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student's tests
// @route   GET /api/tests/student
// @access  Private (Student)
const getStudentTests = async (req, res) => {
  try {
    const studentClass = await Class.findOne({ students: req.user._id });
    if (!studentClass) return res.json({ success: true, data: [] });

    const tests = await Test.find({ classId: studentClass._id, status: "published" })
      .populate("subjectId", "name")
      .populate("teacherId", "name")
      .sort({ testDate: 1 });
      
    // Fetch submissions to attach status
    const submissions = await TestSubmission.find({ studentId: req.user._id });
    const formatted = tests.map(t => {
      const sub = submissions.find(s => s.testId.toString() === t._id.toString());
      return {
        ...t.toObject(),
        submissionStatus: sub ? sub.status : null
      };
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get test by ID
// @route   GET /api/tests/:id
// @access  Private
const getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate("classId", "className students")
      .populate("subjectId", "name")
      .populate("teacherId", "name");

    if (!test) return res.status(404).json({ success: false, message: "Test not found" });

    res.json({ success: true, data: test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit completion request (Student)
// @route   POST /api/tests/:id/submit
// @access  Private (Student)
const submitTest = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user._id;

    const test = await Test.findById(id);
    if (!test || test.status !== "published") {
      return res.status(404).json({ success: false, message: "Test not found" });
    }

    let submission = await TestSubmission.findOne({ testId: id, studentId });
    if (submission) {
      if (submission.status === "submitted" || submission.status === "graded") {
        return res.status(400).json({ success: false, message: "Already submitted" });
      }
      submission.status = "submitted";
      submission.submittedAt = Date.now();
      await submission.save();
    } else {
      submission = await TestSubmission.create({
        testId: id,
        studentId,
        classId: test.classId,
        submittedAt: Date.now(),
        status: "submitted"
      });
    }

    res.status(201).json({ success: true, message: "Completion request sent", data: submission });

    createNotification({
      recipientId: test.teacherId,
      senderId: studentId,
      type: "test_submission",
      title: "Student Ready for Test",
      message: `A student is ready for ${test.title}`,
      relatedId: submission._id,
      relatedModel: "TestSubmission"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all test approvals for a teacher
// @route   GET /api/tests/submissions/approvals
// @access  Private (Teacher)
const getTeacherApprovals = async (req, res) => {
  try {
    const tests = await Test.find({ teacherId: req.user._id }).select('_id');
    const testIds = tests.map(t => t._id);

    const submissions = await TestSubmission.find({ testId: { $in: testIds } })
      .populate("studentId", "name")
      .populate({
        path: "testId",
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

// @desc    Grade submission
// @route   PATCH /api/tests/submissions/:id/review
// @access  Private (Teacher)
const reviewSubmission = async (req, res) => {
  try {
    const { marks, feedback } = req.body;
    const { id } = req.params;

    const submission = await TestSubmission.findById(id).populate("testId");
    if (!submission || submission.testId.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    submission.status = "graded";
    submission.marks = marks !== undefined ? marks : submission.marks;
    submission.feedback = feedback || "";
    submission.reviewedAt = Date.now();
    submission.reviewedBy = req.user._id;
    await submission.save();

    res.json({ success: true, message: `Test graded successfully` });

    createNotification({
      recipientId: submission.studentId,
      senderId: req.user._id,
      type: "test_graded",
      title: "Test Graded",
      message: `Your test '${submission.testId.title}' has been graded. Marks: ${marks}`,
      relatedId: submission._id,
      relatedModel: "TestSubmission"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student's test history
// @route   GET /api/tests/student/history
// @access  Private (Student)
const getStudentHistory = async (req, res) => {
  try {
    const submissions = await TestSubmission.find({ studentId: req.user._id });
    res.json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update test
// @route   PUT /api/tests/:id
// @access  Private (Teacher)
const updateTest = async (req, res) => {
  try {
    const { id } = req.params;
    const test = await Test.findById(id);

    if (!test || test.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized or test not found" });
    }

    const { title, description, classId, subjectId, testDate, durationMinutes, maxMarks, status } = req.body;
    
    test.title = title || test.title;
    test.description = description || test.description;
    test.classId = classId || test.classId;
    test.subjectId = subjectId || test.subjectId;
    test.testDate = testDate || test.testDate;
    test.durationMinutes = durationMinutes || test.durationMinutes;
    test.maxMarks = maxMarks || test.maxMarks;
    test.status = status || test.status;

    if (status === "published" && !test.publishedAt) {
      test.publishedAt = Date.now();
      
      const { createNotification } = require("../services/notificationService");
      const classData = await Class.findById(test.classId);
      if (classData) {
        classData.students.forEach(studentId => {
          createNotification({
            recipientId: studentId,
            senderId: req.user._id,
            type: "test_assigned",
            title: "New Test Assigned",
            message: `${test.title} has been scheduled for ${classData.className} on ${new Date(test.testDate).toLocaleDateString()}`,
            relatedId: test._id,
            relatedModel: "Test"
          });
        });
        
        createNotification({
          recipientId: req.user._id,
          senderId: req.user._id,
          type: "test_created",
          title: "Test Published",
          message: `You successfully published test '${test.title}' for ${classData.className}.`,
          relatedId: test._id,
          relatedModel: "Test"
        });
      }
    }

    await test.save();
    res.json({ success: true, message: "Test updated successfully", data: test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete test
// @route   DELETE /api/tests/:id
// @access  Private (Teacher)
const deleteTest = async (req, res) => {
  try {
    const { id } = req.params;
    const test = await Test.findById(id);

    if (!test || test.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized or test not found" });
    }

    await test.deleteOne();
    await TestSubmission.deleteMany({ testId: id });
    
    res.json({ success: true, message: "Test deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTest,
  getTeacherTests,
  getStudentTests,
  getTestById,
  submitTest,
  getTeacherApprovals,
  reviewSubmission,
  getStudentHistory,
  updateTest,
  deleteTest
};
