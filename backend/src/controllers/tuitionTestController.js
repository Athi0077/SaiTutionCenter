const TuitionTest = require("../models/TuitionTest");
const TuitionTestMark = require("../models/TuitionTestMark");
const Section = require("../models/Section");
const { createNotification } = require("../services/notificationService");

const createTest = async (req, res) => {
  try {
    const { title, batchId, subjectId, testDate, maxMarks, status } = req.body;
    
    const test = new TuitionTest({
      title,
      batchId,
      subjectId,
      teacherId: req.user._id,
      testDate,
      maxMarks,
      status: status || "published"
    });

    await test.save();

    if (test.status === "published") {
      const batch = await Section.findById(batchId);
      if (batch && batch.students) {
        for (const studentId of batch.students) {
          await createNotification({
            recipientId: studentId,
            senderId: req.user._id,
            type: "exam",
            title: "New Tuition Test Scheduled",
            message: `Upcoming test: ${title} on ${new Date(testDate).toLocaleDateString()}`,
            relatedId: test._id,
            relatedModel: "TuitionTest"
          });
        }
      }
    }

    res.json({ success: true, message: "Test created successfully", data: test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTests = async (req, res) => {
  try {
    const { batchId, subjectId, teacherId } = req.query;
    let filter = {};
    if (batchId) filter.batchId = batchId;
    if (subjectId) filter.subjectId = subjectId;
    if (teacherId) filter.teacherId = teacherId;

    const tests = await TuitionTest.find(filter)
      .populate("batchId", "batchName")
      .populate("subjectId", "name")
      .populate("teacherId", "name");
      
    res.json({ success: true, data: tests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const enterMarks = async (req, res) => {
  try {
    const { testId } = req.params;
    const { marks } = req.body; // array of { studentId, marksObtained, remarks }

    if (!Array.isArray(marks)) {
      return res.status(400).json({ success: false, message: "marks must be an array" });
    }

    const test = await TuitionTest.findById(testId);
    if (!test) return res.status(404).json({ success: false, message: "Test not found" });

    // Bulk write for upserts
    const bulkOps = marks.map((m) => ({
      updateOne: {
        filter: { testId, studentId: m.studentId },
        update: {
          testId,
          studentId: m.studentId,
          marksObtained: m.marksObtained,
          remarks: m.remarks,
          enteredBy: req.user._id
        },
        upsert: true
      }
    }));

    if (bulkOps.length > 0) {
      await TuitionTestMark.bulkWrite(bulkOps);
    }

    res.json({ success: true, message: "Marks entered successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMarks = async (req, res) => {
  try {
    const { testId } = req.params;
    const marks = await TuitionTestMark.find({ testId })
      .populate("studentId", "name rollNumber");
      
    res.json({ success: true, data: marks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMyMarks = async (req, res) => {
  try {
    let studentId = req.user._id;
    if (req.user.role === 'parent') {
        const User = require("../models/User");
        const child = await User.findOne({ parentId: req.user._id, role: 'student' });
        if (!child) return res.status(404).json({ success: false, message: "Child not found" });
        studentId = child._id;
    }

    const marks = await TuitionTestMark.find({ studentId })
      .populate({
        path: "testId",
        populate: [
          { path: "batchId", select: "batchName" },
          { path: "subjectId", select: "name" }
        ]
      });
      
    res.json({ success: true, data: marks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTest,
  getTests,
  enterMarks,
  getMarks,
  getMyMarks
};
