const Homework = require("../models/Homework");
const Class = require("../models/Class");
const Subject = require("../models/Subject");

// @desc    Create new homework
// @route   POST /api/homework
// @access  Private (Teacher only)
const createHomework = async (req, res) => {
  try {
    const { title, description, classId, subjectId, dueDate, priority, attachments, status } = req.body;
    const teacherId = req.user._id;

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    let hasAccess = false;
    if (classData.teacherId && classData.teacherId.toString() === teacherId.toString()) {
      hasAccess = true;
    } else {
      const TeacherAssignment = require("../models/TeacherAssignment");
      const assignments = await TeacherAssignment.find({ teacherId })
        .populate("standardId", "name")
        .populate("sectionId", "name");
      
      hasAccess = assignments.some(a => 
        a.standardId?.name === classData.standard && 
        a.sectionId?.name === classData.section
      );
    }

    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "You are not authorized to create homework for this class" });
    }

    const subjectAssigned = classData.subjects.some(s => s.toString() === subjectId.toString());
    if (!subjectAssigned) {
      return res.status(400).json({ success: false, message: "Subject is not assigned to this class" });
    }

    const homework = await Homework.create({
      title,
      description,
      classId,
      subjectId,
      teacherId,
      dueDate,
      priority: priority || "normal",
      attachments: attachments || [],
      status: status || "draft",
      publishedAt: status === "published" ? Date.now() : null,
    });

    res.status(201).json({ success: true, message: "Homework created successfully", data: homework });

    if (status === "published") {
      const { createNotification } = require("../services/notificationService");
      classData.students.forEach(studentId => {
        createNotification({
          recipientId: studentId,
          senderId: teacherId,
          type: "homework_assigned",
          title: "New Homework",
          message: `${title} has been assigned for ${classData.className}. Due: ${new Date(dueDate).toLocaleDateString()}`,
          relatedId: homework._id,
          relatedModel: "Homework"
        });
      });
      
      // Notify the teacher as well
      createNotification({
        recipientId: teacherId,
        senderId: teacherId,
        type: "homework_created",
        title: "Homework Published",
        message: `You successfully published homework '${title}' for ${classData.className}.`,
        relatedId: homework._id,
        relatedModel: "Homework"
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get teacher's homework
// @route   GET /api/homework/teacher
// @access  Private (Teacher only)
const getTeacherHomework = async (req, res) => {
  try {
    const homework = await Homework.find({ teacherId: req.user._id })
      .populate("classId", "className")
      .populate("subjectId", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: homework });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student's homework
// @route   GET /api/homework/student
// @access  Private (Student only)
const getStudentHomework = async (req, res) => {
  try {
    const studentClass = await Class.findOne({ students: req.user._id });
    if (!studentClass) {
      return res.json({ success: true, data: [] });
    }

    const homework = await Homework.find({ classId: studentClass._id, status: "published" })
      .populate("subjectId", "name")
      .populate("teacherId", "name")
      .sort({ dueDate: 1 });
    const HomeworkSubmission = require("../models/HomeworkSubmission");
    const submissions = await HomeworkSubmission.find({ studentId: req.user._id });

    const formattedHomework = homework.map(hw => {
      const sub = submissions.find(s => s.homeworkId.toString() === hw._id.toString());
      return {
        ...hw.toObject(),
        submissionStatus: sub ? sub.status : null
      };
    });
      
    res.json({ success: true, data: formattedHomework });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get homework by ID
// @route   GET /api/homework/:id
// @access  Private
const getHomeworkById = async (req, res) => {
  try {
    const homework = await Homework.findById(req.params.id)
      .populate("classId", "className students")
      .populate("subjectId", "name")
      .populate("teacherId", "name");

    if (!homework) {
      return res.status(404).json({ success: false, message: "Homework not found" });
    }

    if (req.user.role === "teacher" && homework.teacherId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (req.user.role === "student") {
      const studentClass = await Class.findById(homework.classId._id);
      if (!studentClass.students.includes(req.user._id)) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
    }

    res.json({ success: true, data: homework });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all homework (Admin overview)
// @route   GET /api/homework/admin-overview
// @access  Private (Principal only)
const getAdminOverview = async (req, res) => {
  try {
    const { classId, date } = req.query;
    
    let filter = {};
    if (classId) {
      filter.classId = classId;
    }
    
    if (date) {
      // Filter by the date homework was created
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      filter.createdAt = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const homework = await Homework.find(filter)
      .populate("classId", "className standard section")
      .populate("subjectId", "name")
      .populate("teacherId", "name")
      .sort({ createdAt: -1 });
      
    res.json({ success: true, data: homework });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update homework
// @route   PUT /api/homework/:id
// @access  Private (Teacher only)
const updateHomework = async (req, res) => {
  try {
    const { title, description, dueDate, priority, status } = req.body;
    let homework = await Homework.findById(req.params.id);

    if (!homework) {
      return res.status(404).json({ success: false, message: "Homework not found" });
    }

    if (homework.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    homework.title = title || homework.title;
    homework.description = description || homework.description;
    if (dueDate) homework.dueDate = dueDate;
    if (priority) homework.priority = priority;
    if (status) {
      if (status === "published" && homework.status !== "published") {
        homework.publishedAt = Date.now();
        
        // Notify students and teacher when draft is published
        const { createNotification } = require("../services/notificationService");
        const classData = await Class.findById(homework.classId);
        if (classData) {
          classData.students.forEach(studentId => {
            createNotification({
              recipientId: studentId,
              senderId: req.user._id,
              type: "homework_assigned",
              title: "New Homework",
              message: `${homework.title} has been assigned for ${classData.className}. Due: ${new Date(homework.dueDate).toLocaleDateString()}`,
              relatedId: homework._id,
              relatedModel: "Homework"
            });
          });
          
          createNotification({
            recipientId: req.user._id,
            senderId: req.user._id,
            type: "homework_created",
            title: "Homework Published",
            message: `You successfully published homework '${homework.title}' for ${classData.className}.`,
            relatedId: homework._id,
            relatedModel: "Homework"
          });
        }
      }
      homework.status = status;
    }

    await homework.save();
    res.json({ success: true, message: "Homework updated", data: homework });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete homework
// @route   DELETE /api/homework/:id
// @access  Private (Teacher only)
const deleteHomework = async (req, res) => {
  try {
    const homework = await Homework.findById(req.params.id);
    if (!homework) {
      return res.status(404).json({ success: false, message: "Homework not found" });
    }

    if (req.user.role !== "principal" && homework.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    await Homework.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Homework deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createHomework,
  getTeacherHomework,
  getStudentHomework,
  getHomeworkById,
  getAdminOverview,
  updateHomework,
  deleteHomework,
};
