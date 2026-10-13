const Class = require("../models/Class");
const User = require("../models/User");

// @desc    Create a new class
// @route   POST /api/classes
// @access  Private (Teacher only)
const createClass = async (req, res) => {
  try {
    const { standard, section } = req.body;
    const teacherId = req.user._id;

    if (!standard || !section) {
      return res.status(400).json({ success: false, message: "Standard and section are required" });
    }

    const className = `${standard} - ${section}`;

    // Prevent duplicate class creation by the same teacher
    const classExists = await Class.findOne({ teacherId, className });
    if (classExists) {
      return res.status(400).json({ success: false, message: "This class already exists." });
    }

    const newClass = await Class.create({
      standard,
      section,
      className,
      teacherId,
      status: "active",
    });

    res.status(201).json({ success: true, message: "Class created successfully", data: newClass });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get teacher's classes
// @route   GET /api/classes/my-classes
// @access  Private (Teacher only)
const getMyClasses = async (req, res) => {
  try {
    const query = req.user.schoolId ? { schoolId: req.user.schoolId } : {};
    let classes = await Class.find(query).populate('students', '_id role').populate('classLeader', '_id name').populate('teacherId', 'name email');
    
    // Filter out invalid/deleted student IDs
    classes = classes.map(c => {
      const cls = c.toObject();
      cls.students = (cls.students || []).filter(s => s && s.role === 'student');
      return cls;
    });

    res.json({ success: true, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student's joined class
// @route   GET /api/classes/my-class
// @access  Private (Student only)
const getStudentClass = async (req, res) => {
  try {
    let targetStudentId = req.user._id;

    if (req.user.role === 'parent') {
      const parentUser = await User.findById(req.user._id);
      if (!parentUser || !parentUser.children || parentUser.children.length === 0) {
        return res.status(404).json({ success: false, message: "No children linked to your account." });
      }
      targetStudentId = req.query.studentId || parentUser.children[0];
      
      // Ensure the requested studentId is actually a child of this parent
      if (req.query.studentId && !parentUser.children.map(id => id.toString()).includes(req.query.studentId)) {
        return res.status(403).json({ success: false, message: "Unauthorized access to this student's class." });
      }
    }

    const studentClass = await Class.findOne({ students: targetStudentId }).populate("teacherId", "name email");
    if (!studentClass) {
      return res.status(404).json({ success: false, message: "No class joined yet." });
    }
    
    // For student privacy, don't populate all student details, maybe just count or basic info
    const populatedClass = await Class.findById(studentClass._id)
      .populate("teacherId", "name email")
      .populate("students", "name")
      .populate("classLeader", "name _id");

    const Standard = require("../models/Standard");
    const Section = require("../models/Section");
    const TeacherAssignment = require("../models/TeacherAssignment");

    const standardDoc = await Standard.findOne({ name: studentClass.standard });
    
    let sectionDoc = null;
    if (standardDoc) {
      sectionDoc = await Section.findOne({ name: studentClass.section, standardId: standardDoc._id });
    }

    let staff = [];
    if (standardDoc && sectionDoc) {
      staff = await TeacherAssignment.find({
        standardId: standardDoc._id,
        sectionId: sectionDoc._id,
      }).populate("teacherId", "name");
    }

    res.json({ success: true, data: populatedClass, staff: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private (Principal only)
const getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate("teacherId", "name email")
      .populate("classLeader", "name _id")
      .populate("students", "name email studentId rollNumber role");
    
    const formatted = classes.map(c => {
      const cls = c.toObject();
      cls.students = (cls.students || []).filter(s => s && s.role === 'student');
      return cls;
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get available classes for student to join
// @route   GET /api/classes/available
// @access  Private (Student only)
const getAvailableClasses = async (req, res) => {
  try {
    const classes = await Class.find({ status: "active" }).populate("teacherId", "name");
    res.json({ success: true, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get class details by ID
// @route   GET /api/classes/:id
// @access  Private
const getClassById = async (req, res) => {
  try {
    const classId = req.params.id;
    const classData = await Class.findById(classId)
      .populate("teacherId", "name email")
      .populate("students", "name email phone address studentId grNumber profilePic gender dateOfBirth contactDetails")
      .populate("classLeader", "name _id");

    if (!classData) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    // Any teacher in the institution can view class details
    if (req.user.role === "teacher") {
      // Access granted
    }

    if (req.user.role === "student" && !classData.students.some(s => s._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const Attendance = require("../models/Attendance");
    const ExamMark = require("../models/ExamMark");
    const HomeworkSubmission = require("../models/HomeworkSubmission");

    // Add parent info & summary scores to students
    const studentsWithParents = await Promise.all(classData.students.map(async (student) => {
      const parent = await User.findOne({ role: 'parent', children: student._id });

      // Compute quick attendance %
      const attRecords = await Attendance.find({ studentId: student._id });
      const totalAtt = attRecords.length;
      const presentAtt = attRecords.filter(a => a.status === 'present').length;
      const attendancePercentage = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100;

      // Compute quick academic % (Avg of exam marks & homework submissions)
      const examMarks = await ExamMark.find({ studentId: student._id });
      const hwSubs = await HomeworkSubmission.find({ studentId: student._id, marks: { $ne: null } });

      let totalPctSum = 0;
      let count = 0;

      examMarks.forEach(em => {
        if (!em.isAbsent && em.marksObtained !== undefined) {
          totalPctSum += em.marksObtained; // assuming 100 max
          count++;
        }
      });

      hwSubs.forEach(hw => {
        if (hw.marks !== undefined && hw.maxMarks > 0) {
          totalPctSum += Math.round((hw.marks / hw.maxMarks) * 100);
          count++;
        }
      });

      const academicScore = count > 0 ? Math.round(totalPctSum / count) : 100;

      return {
        ...student.toObject(),
        parentName: parent ? parent.name : (student.contactDetails?.parentName || null),
        parentPhone: parent ? parent.phone : (student.contactDetails?.parentPhone || null),
        address: student.address || (parent ? parent.address : null),
        attendancePercentage,
        academicScore,
      };
    }));
    
    const enhancedClassData = classData.toObject();
    enhancedClassData.students = studentsWithParents;

    res.json({ success: true, data: enhancedClassData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Student leaves their class
// @route   DELETE /api/classes/my-class
// @access  Private (Student only)
const leaveClass = async (req, res) => {
  try {
    const studentClass = await Class.findOne({ students: req.user._id });
    
    if (!studentClass) {
      return res.status(400).json({ success: false, message: "You are not a member of any class" });
    }

    studentClass.students = studentClass.students.filter(
      (studentId) => studentId.toString() !== req.user._id.toString()
    );
    
    await studentClass.save();
    
    // We should also remove the approved request
    const ClassJoinRequest = require("../models/ClassJoinRequest");
    await ClassJoinRequest.deleteMany({ studentId: req.user._id, classId: studentClass._id });

    res.json({ success: true, message: "Left class successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a class
// @route   DELETE /api/classes/:id
// @access  Private (Principal only)
const deleteClass = async (req, res) => {
  try {
    const classId = req.params.id;
    const classToDelete = await Class.findById(classId);

    if (!classToDelete) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    // Optional: add logic here to delete or update related records if needed
    // e.g., TeacherAssignments, Homework, etc.
    
    await Class.findByIdAndDelete(classId);

    res.json({ success: true, message: "Class deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add student to class
// @route   POST /api/classes/:classId/students
// @access  Private (Teacher, Principal)
const addStudentToClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { studentId, studentIdentifier } = req.body;

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const User = require("../models/User");
    let student = null;

    if (studentId) {
      student = await User.findById(studentId);
    }
    if (!student && studentIdentifier) {
      student = await User.findOne({
        $or: [
          { studentId: studentIdentifier.trim() },
          { email: studentIdentifier.trim().toLowerCase() },
          { name: studentIdentifier.trim() }
        ],
        role: "student"
      });
    }

    if (!student || student.role !== "student") {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    if (classData.students.some(s => s.toString() === student._id.toString())) {
      return res.status(400).json({ success: false, message: `${student.name} is already enrolled in this class.` });
    }

    classData.students.push(student._id);
    await classData.save();

    // Link Section if available
    if (classData.sectionId) {
      const Section = require("../models/Section");
      await Section.findByIdAndUpdate(classData.sectionId, {
        $addToSet: { students: student._id }
      });
    }

    // Enroll in active academic year
    const AcademicYear = require("../models/AcademicYear");
    const Enrollment = require("../models/Enrollment");
    const activeYear = await AcademicYear.findOne({ status: "active" });
    if (activeYear) {
      const existingEnrollment = await Enrollment.findOne({
        studentId: student._id,
        academicYearId: activeYear._id,
        classId: classData._id
      });
      if (!existingEnrollment) {
        await Enrollment.create({
          studentId: student._id,
          academicYearId: activeYear._id,
          classId: classData._id,
          schoolId: req.user.schoolId || classData.schoolId,
          type: "new_admission",
          status: "active"
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `${student.name} added to class successfully`,
      data: student
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove student from class
// @route   DELETE /api/classes/:classId/students/:studentId
// @access  Private (Teacher, Principal)
const removeStudentFromClass = async (req, res) => {
  try {
    const { classId, studentId } = req.params;

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    classData.students = classData.students.filter(
      (s) => s.toString() !== studentId.toString()
    );
    await classData.save();

    res.json({ success: true, message: "Student removed from class successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createClass,
  getMyClasses,
  getStudentClass,
  getAllClasses,
  getAvailableClasses,
  getClassById,
  leaveClass,
  deleteClass,
  addStudentToClass,
  removeStudentFromClass,
};
