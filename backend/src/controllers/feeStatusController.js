const FeeStatus = require("../models/FeeStatus");
const Class = require("../models/Class");
const User = require("../models/User");
const TeacherAssignment = require("../models/TeacherAssignment");
const AcademicYear = require("../models/AcademicYear");

const { checkAndRolloverFees } = require("../services/feeCycleScheduler");

/**
 * Helper: Check if a teacher has access to a class
 */
const teacherHasClassAccess = async (teacherId, classDoc, reqUser) => {
  if (reqUser && reqUser.role === 'principal') return true;
  if (classDoc.schoolId && reqUser && reqUser.schoolId && classDoc.schoolId.toString() === reqUser.schoolId.toString()) {
    return true;
  }
  // Check if they are the primary class teacher
  if (classDoc.teacherId && classDoc.teacherId.toString() === teacherId.toString()) {
    return true;
  }
  // Check if they are assigned as a subject teacher
  const assignments = await TeacherAssignment.find({ teacherId })
    .populate("standardId", "name")
    .populate("sectionId", "name");

  return assignments.some(
    (a) =>
      a.standardId?.name === classDoc.standard &&
      a.sectionId?.name === classDoc.section
  );
};

/**
 * Helper: Get current academic year or null
 */
const getCurrentAcademicYear = async () => {
  return await AcademicYear.findOne({ status: "active" }).sort({ createdAt: -1 });
};

// @desc    Get fee statuses for all students in a class
// @route   GET /api/fee-status/class/:classId
// @access  Private (Teacher)
const getClassFeeStatuses = async (req, res) => {
  try {
    // Automatically evaluate rollover if new month/year started
    await checkAndRolloverFees();

    const { classId } = req.params;
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    // Verify teacher access
    const hasAccess = await teacherHasClassAccess(req.user._id, classDoc, req.user);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: "Access denied. You are not assigned to this class." });
    }

    const academicYear = await getCurrentAcademicYear();
    const query = {
      classId,
      term: "current",
    };
    if (academicYear) {
      query.academicYearId = academicYear._id;
    }

    const feeStatuses = await FeeStatus.find(query)
      .populate("updatedBy", "name")
      .lean();

    // Build a map: studentId -> feeStatus
    const statusMap = {};
    feeStatuses.forEach((fs) => {
      statusMap[fs.studentId.toString()] = {
        feeStatus: fs.feeStatus,
        statusUpdatedAt: fs.statusUpdatedAt,
        updatedBy: fs.updatedBy,
      };
    });

    // For students without a record, default to pending
    const result = {};
    (classDoc.students || []).forEach((studentId) => {
      const sid = studentId.toString();
      result[sid] = statusMap[sid] || { feeStatus: "pending", statusUpdatedAt: null, updatedBy: null };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a student's fee status
// @route   PUT /api/fee-status/student/:studentId
// @access  Private (Teacher)
const updateStudentFeeStatus = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { feeStatus } = req.body;

    // Validate feeStatus value
    if (!feeStatus || !["pending", "completed"].includes(feeStatus)) {
      return res.status(400).json({
        success: false,
        message: "feeStatus must be 'pending' or 'completed'",
      });
    }

    // Verify the student exists and is actually a student
    const student = await User.findById(studentId);
    if (!student || student.role !== "student") {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Find the class containing this student
    const studentClass = await Class.findOne({ students: studentId });
    if (!studentClass) {
      return res.status(404).json({
        success: false,
        message: "Student is not enrolled in any class",
      });
    }

    // Verify the requesting teacher has access to this class
    const hasAccess = await teacherHasClassAccess(req.user._id, studentClass, req.user);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You are not assigned to this student's class.",
      });
    }

    const academicYear = await getCurrentAcademicYear();

    // Upsert fee status
    const filter = {
      studentId,
      classId: studentClass._id,
      term: "current",
    };
    if (academicYear) {
      filter.academicYearId = academicYear._id;
    }

    const update = {
      feeStatus,
      updatedBy: req.user._id,
      statusUpdatedAt: new Date(),
    };
    if (academicYear) {
      update.academicYearId = academicYear._id;
    }

    const record = await FeeStatus.findOneAndUpdate(
      filter,
      { $set: update },
      { upsert: true, new: true, runValidators: true }
    );

    // Also sync TuitionFee status
    const TuitionFee = require("../models/TuitionFee");
    await TuitionFee.updateMany(
      { studentId },
      {
        $set: {
          status: feeStatus === "completed" ? "COMPLETED" : "PENDING"
        }
      }
    );

    res.json({
      success: true,
      message: `Fee status updated to '${feeStatus}'`,
      data: {
        studentId,
        feeStatus: record.feeStatus,
        statusUpdatedAt: record.statusUpdatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get fee status for the authenticated student
// @route   GET /api/fee-status/my-status
// @access  Private (Student)
const getMyFeeStatus = async (req, res) => {
  try {
    await checkAndRolloverFees();

    const studentClass = await Class.findOne({ students: req.user._id });
    if (!studentClass) {
      return res.json({ success: true, data: { feeStatus: "pending" } });
    }

    const academicYear = await getCurrentAcademicYear();
    const query = {
      studentId: req.user._id,
      classId: studentClass._id,
      term: "current",
    };
    if (academicYear) {
      query.academicYearId = academicYear._id;
    }

    const record = await FeeStatus.findOne(query);

    res.json({
      success: true,
      data: {
        feeStatus: record ? record.feeStatus : "pending",
        statusUpdatedAt: record ? record.statusUpdatedAt : null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get fee status for a parent's child
// @route   GET /api/fee-status/child/:childId
// @access  Private (Parent)
const getChildFeeStatus = async (req, res) => {
  try {
    const { childId } = req.params;

    // Verify parent-child relationship
    const parent = await User.findById(req.user._id);
    if (!parent || !parent.children || !parent.children.map((id) => id.toString()).includes(childId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. This student is not linked to your account.",
      });
    }

    const studentClass = await Class.findOne({ students: childId });
    if (!studentClass) {
      return res.json({ success: true, data: { feeStatus: "pending" } });
    }

    const academicYear = await getCurrentAcademicYear();
    const query = {
      studentId: childId,
      classId: studentClass._id,
      term: "current",
    };
    if (academicYear) {
      query.academicYearId = academicYear._id;
    }

    const record = await FeeStatus.findOne(query);

    res.json({
      success: true,
      data: {
        feeStatus: record ? record.feeStatus : "pending",
        statusUpdatedAt: record ? record.statusUpdatedAt : null,
        childId,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get fee statuses for all children of a parent
// @route   GET /api/fee-status/my-children
// @access  Private (Parent)
const getMyChildrenFeeStatuses = async (req, res) => {
  try {
    const parent = await User.findById(req.user._id);
    if (!parent || !parent.children || parent.children.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const academicYear = await getCurrentAcademicYear();
    const results = [];

    for (const childId of parent.children) {
      const studentClass = await Class.findOne({ students: childId });
      if (!studentClass) {
        results.push({ childId, feeStatus: "pending", statusUpdatedAt: null });
        continue;
      }

      const query = {
        studentId: childId,
        classId: studentClass._id,
        term: "current",
      };
      if (academicYear) {
        query.academicYearId = academicYear._id;
      }

      const record = await FeeStatus.findOne(query);
      results.push({
        childId,
        feeStatus: record ? record.feeStatus : "pending",
        statusUpdatedAt: record ? record.statusUpdatedAt : null,
      });
    }

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getClassFeeStatuses,
  updateStudentFeeStatus,
  getMyFeeStatus,
  getChildFeeStatus,
  getMyChildrenFeeStatuses,
};
