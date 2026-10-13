const SpecialClass = require("../models/SpecialClass");
const SpecialClassEnrollment = require("../models/SpecialClassEnrollment");
const SpecialClassAttendance = require("../models/SpecialClassAttendance");
const SpecialClassProgress = require("../models/SpecialClassProgress");
const User = require("../models/User");
const Class = require("../models/Class");
const { createNotification } = require("../services/notificationService");

// ==============================================
// PRINCIPAL METHODS
// ==============================================

exports.createClass = async (req, res) => {
  try {
    const newClass = new SpecialClass({
      ...req.body,
      createdBy: req.user._id
    });
    await newClass.save();
    res.status(201).json({ success: true, data: newClass });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateClass = async (req, res) => {
  try {
    const specialClass = await SpecialClass.findById(req.params.id);
    if (!specialClass) return res.status(404).json({ success: false, message: "Class not found" });

    Object.assign(specialClass, req.body);
    await specialClass.save();
    res.json({ success: true, data: specialClass });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.publishClass = async (req, res) => {
  try {
    const specialClass = await SpecialClass.findById(req.params.id);
    if (!specialClass) return res.status(404).json({ success: false, message: "Class not found" });

    specialClass.status = "Published";
    specialClass.publishedAt = Date.now();
    await specialClass.save();

    res.json({ success: true, data: specialClass });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.openRegistration = async (req, res) => {
  try {
    const specialClass = await SpecialClass.findById(req.params.id);
    if (!specialClass) return res.status(404).json({ success: false, message: "Class not found" });

    specialClass.status = "Registration Open";
    await specialClass.save();

    res.json({ success: true, data: specialClass });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.closeRegistration = async (req, res) => {
  try {
    const specialClass = await SpecialClass.findById(req.params.id);
    if (!specialClass) return res.status(404).json({ success: false, message: "Class not found" });

    specialClass.status = "Registration Closed";
    await specialClass.save();

    res.json({ success: true, data: specialClass });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.startClass = async (req, res) => {
  try {
    const specialClass = await SpecialClass.findById(req.params.id);
    if (!specialClass) return res.status(404).json({ success: false, message: "Class not found" });

    specialClass.status = "Active";
    await specialClass.save();

    res.json({ success: true, data: specialClass });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.completeClass = async (req, res) => {
  try {
    const specialClass = await SpecialClass.findById(req.params.id);
    if (!specialClass) return res.status(404).json({ success: false, message: "Class not found" });

    specialClass.status = "Completed";
    specialClass.completedAt = Date.now();
    await specialClass.save();

    res.json({ success: true, data: specialClass });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getAllClasses = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === "teacher" && !req.user.isTempPrincipal) {
      query.instructorId = req.user._id;
      query.status = { $ne: "Draft" }; // Teachers shouldn't see drafts they didn't create
    }

    const classes = await SpecialClass.find(query)
      .populate("instructorId", "name email profilePic designation")
      .sort("-createdAt");

    // Add enrollment counts
    const classesWithCounts = await Promise.all(classes.map(async (c) => {
      const count = await SpecialClassEnrollment.countDocuments({ specialClassId: c._id, status: "Enrolled" });
      const pendingCount = await SpecialClassEnrollment.countDocuments({ specialClassId: c._id, status: "Pending" });
      return { ...c.toObject(), enrolledCount: count, pendingCount };
    }));

    res.json({ success: true, data: classesWithCounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getClassDetails = async (req, res) => {
  try {
    const specialClass = await SpecialClass.findById(req.params.id)
      .populate("instructorId", "name email profilePic designation")
      .populate("createdBy", "name");

    if (!specialClass) return res.status(404).json({ success: false, message: "Class not found" });

    const enrolledCount = await SpecialClassEnrollment.countDocuments({ specialClassId: specialClass._id, status: "Enrolled" });
    
    res.json({ success: true, data: { ...specialClass.toObject(), enrolledCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================
// ENROLLMENT MANAGEMENT (Principal/Instructor)
// ==============================================

exports.getEnrollments = async (req, res) => {
  try {
    const specialClass = await SpecialClass.findById(req.params.id);
    if (!specialClass) return res.status(404).json({ success: false, message: "Class not found" });

    // Auth check: Must be principal or instructor
    if (req.user.role !== "principal" && !req.user.isTempPrincipal) {
      if (specialClass.instructorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized to view enrollments for this class" });
      }
    }

    const enrollments = await SpecialClassEnrollment.find({ specialClassId: req.params.id })
      .populate("studentId", "name studentId profilePic")
      .sort("-requestedAt");

    // We need standard/section for students. Students are mapped to Classes via Class model.
    // Let's attach class info to each student.
    const studentIds = enrollments.map(e => e.studentId?._id).filter(id => id);
    const classes = await Class.find({ students: { $in: studentIds } });
    
    const enrichedEnrollments = enrollments.map(e => {
      const studentClass = classes.find(c => c.students.some(sId => sId.toString() === e.studentId?._id.toString()));
      return {
        ...e.toObject(),
        standard: studentClass?.standard,
        section: studentClass?.section
      };
    });

    res.json({ success: true, data: enrichedEnrollments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.approveEnrollment = async (req, res) => {
  try {
    const enrollment = await SpecialClassEnrollment.findById(req.params.enrollmentId).populate("studentId", "name");
    if (!enrollment) return res.status(404).json({ success: false, message: "Enrollment not found" });

    const specialClass = await SpecialClass.findById(enrollment.specialClassId);

    // Auth check
    if (req.user.role !== "principal" && !req.user.isTempPrincipal) {
      if (specialClass.instructorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
      }
    }

    // Capacity check
    if (specialClass.maxStudents) {
      const enrolledCount = await SpecialClassEnrollment.countDocuments({ specialClassId: specialClass._id, status: "Enrolled" });
      if (enrolledCount >= specialClass.maxStudents) {
        return res.status(400).json({ success: false, message: "Class is at maximum capacity" });
      }
    }

    enrollment.status = "Enrolled";
    enrollment.approvedAt = Date.now();
    enrollment.approvedBy = req.user._id;
    enrollment.enrolledAt = Date.now();
    await enrollment.save();

    // Create Initial Progress Record
    const initialProgress = new SpecialClassProgress({
      specialClassId: specialClass._id,
      studentId: enrollment.studentId._id,
      skillsProgress: specialClass.skills.map(skill => ({ skillName: skill, level: "Not Started" }))
    });
    await initialProgress.save();

    await createNotification({
      recipientId: enrollment.studentId._id,
      type: "special_class_approved",
      title: "Enrollment Approved",
      message: `Your enrollment in ${specialClass.title} has been approved.`
    });

    res.json({ success: true, data: enrollment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.rejectEnrollment = async (req, res) => {
  try {
    const enrollment = await SpecialClassEnrollment.findById(req.params.enrollmentId);
    if (!enrollment) return res.status(404).json({ success: false, message: "Enrollment not found" });

    const specialClass = await SpecialClass.findById(enrollment.specialClassId);
    if (req.user.role !== "principal" && !req.user.isTempPrincipal) {
      if (specialClass.instructorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
      }
    }

    enrollment.status = "Rejected";
    enrollment.rejectedAt = Date.now();
    enrollment.rejectedBy = req.user._id;
    await enrollment.save();

    await createNotification({
      recipientId: enrollment.studentId,
      type: "special_class_rejected",
      title: "Enrollment Rejected",
      message: `Your enrollment request for ${specialClass.title} was rejected.`
    });

    res.json({ success: true, data: enrollment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================
// STUDENT METHODS
// ==============================================

exports.getAvailableClasses = async (req, res) => {
  try {
    let studentIds = [req.user._id];
    let standards = [];
    let sections = [];

    if (req.user.role === "parent") {
      const parentUser = await User.findById(req.user._id).populate("children");
      if (parentUser && parentUser.children && parentUser.children.length > 0) {
        studentIds = parentUser.children.map(c => c._id || c);
        const childrenClasses = await Class.find({ students: { $in: studentIds } });
        standards = childrenClasses.map(c => c.standard);
        sections = childrenClasses.map(c => c.section);
      }
    } else {
      const studentClass = await Class.findOne({ students: req.user._id });
      if (studentClass) {
        standards.push(studentClass.standard);
        sections.push(studentClass.section);
      }
    }

    const query = {
      status: { $in: ["Published", "Registration Open", "Active", "Registration Closed"] },
    };

    const classes = await SpecialClass.find(query)
      .populate("instructorId", "name profilePic designation")
      .sort("-createdAt");

    // Filter by standard/section logic
    let availableClasses = classes.filter(c => {
      if (c.eligibleStandards.length > 0 && !c.eligibleStandards.includes("All Students")) {
         const hasMatchingStandard = standards.some(std => c.eligibleStandards.includes(std));
         if (!hasMatchingStandard) return false;
      }
      if (c.eligibleSections.length > 0) {
         const hasMatchingSection = sections.some(sec => c.eligibleSections.includes(sec));
         if (!hasMatchingSection) return false;
      }
      return true;
    });

    // Get user's or children's existing enrollments
    const enrollments = await SpecialClassEnrollment.find({ studentId: { $in: studentIds } });
    
    // Attach enrollment status and capacity
    const enrichedClasses = await Promise.all(availableClasses.map(async (c) => {
      const myEnrollment = enrollments.find(e => e.specialClassId.toString() === c._id.toString());
      const enrolledCount = await SpecialClassEnrollment.countDocuments({ specialClassId: c._id, status: "Enrolled" });
      
      return {
        ...c.toObject(),
        myStatus: myEnrollment ? myEnrollment.status : null,
        myEnrollmentId: myEnrollment ? myEnrollment._id : null,
        enrolledCount
      };
    }));

    res.json({ success: true, data: enrichedClasses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.submitInterest = async (req, res) => {
  try {
    const specialClass = await SpecialClass.findById(req.params.id);
    if (!specialClass) return res.status(404).json({ success: false, message: "Class not found" });

    if (specialClass.status !== "Registration Open") {
      return res.status(400).json({ success: false, message: "Registration is not open for this class" });
    }

    if (specialClass.registrationDeadline && new Date() > new Date(specialClass.registrationDeadline)) {
      return res.status(400).json({ success: false, message: "Registration deadline has passed" });
    }

    let targetStudentId = req.user._id;
    if (req.user.role === "parent") {
      const parentUser = await User.findById(req.user._id);
      if (parentUser && parentUser.children && parentUser.children.length > 0) {
        targetStudentId = parentUser.children[0];
      } else {
        return res.status(400).json({ success: false, message: "No linked children found" });
      }
    }

    const existingEnrollment = await SpecialClassEnrollment.findOne({ specialClassId: specialClass._id, studentId: targetStudentId });
    if (existingEnrollment) {
      return res.status(400).json({ success: false, message: "You have already submitted an interest or are enrolled" });
    }

    const enrolledCount = await SpecialClassEnrollment.countDocuments({ specialClassId: specialClass._id, status: "Enrolled" });
    const isFull = specialClass.maxStudents && enrolledCount >= specialClass.maxStudents;

    let initialStatus = "Interested";
    if (specialClass.enrollmentMode === "Approval") {
      initialStatus = "Pending";
    } else if (specialClass.enrollmentMode === "Direct") {
      if (isFull) {
        initialStatus = "Waitlisted";
      } else {
        initialStatus = "Enrolled";
      }
    }

    const enrollment = new SpecialClassEnrollment({
      specialClassId: specialClass._id,
      studentId: targetStudentId,
      status: initialStatus,
      enrolledAt: initialStatus === "Enrolled" ? Date.now() : undefined,
      waitlistPosition: initialStatus === "Waitlisted" ? await SpecialClassEnrollment.countDocuments({ specialClassId: specialClass._id, status: "Waitlisted" }) + 1 : undefined
    });
    
    await enrollment.save();

    if (initialStatus === "Enrolled") {
      // Create initial progress
      const initialProgress = new SpecialClassProgress({
        specialClassId: specialClass._id,
        studentId: targetStudentId,
        skillsProgress: specialClass.skills.map(skill => ({ skillName: skill, level: "Not Started" }))
      });
      await initialProgress.save();
    }

    res.status(201).json({ success: true, data: enrollment, message: `Successfully ${initialStatus.toLowerCase()}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyClasses = async (req, res) => {
  try {
    let studentIds = [req.user._id];

    if (req.user.role === "parent") {
      const parentUser = await User.findById(req.user._id).populate("children");
      if (parentUser && parentUser.children && parentUser.children.length > 0) {
        studentIds = parentUser.children.map(c => c._id || c);
      } else {
        studentIds = []; // No children linked
      }
    }

    const enrollments = await SpecialClassEnrollment.find({ 
      studentId: { $in: studentIds }, 
      status: { $in: ["Enrolled", "Completed"] } 
    }).populate("studentId", "name studentId").populate({
      path: "specialClassId",
      populate: { path: "instructorId", select: "name" }
    });

    const enriched = await Promise.all(enrollments.map(async (e) => {
      const sc = e.specialClassId;
      // Get attendance stats
      const totalSessions = await SpecialClassAttendance.distinct("date", { specialClassId: sc._id });
      const presentSessions = await SpecialClassAttendance.countDocuments({ specialClassId: sc._id, studentId: e.studentId._id, status: "Present" });
      
      const attendancePercent = totalSessions.length > 0 ? Math.round((presentSessions / totalSessions.length) * 100) : 100;
      
      // Get progress
      const progress = await SpecialClassProgress.findOne({ specialClassId: sc._id, studentId: e.studentId._id });

      return {
        ...e.toObject(),
        specialClass: sc,
        studentName: e.studentId?.name, // Add student name for parent view differentiation
        attendance: {
          present: presentSessions,
          total: totalSessions.length,
          percentage: attendancePercent
        },
        progress: progress ? progress.toObject() : null
      };
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================================
// ATTENDANCE & PROGRESS (Teacher/Principal)
// ==============================================

exports.getAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: "Date is required (YYYY-MM-DD)" });

    const attendance = await SpecialClassAttendance.find({ specialClassId: req.params.id, date });
    res.json({ success: true, data: attendance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const { date, records } = req.body; // records: [{ studentId, status }]
    if (!date || !records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: "Invalid payload" });
    }

    const specialClass = await SpecialClass.findById(req.params.id);
    if (!specialClass) return res.status(404).json({ success: false, message: "Class not found" });

    // Validate Auth
    if (req.user.role !== "principal" && !req.user.isTempPrincipal) {
      if (specialClass.instructorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
      }
    }

    const bulkOps = records.map(record => ({
      updateOne: {
        filter: { specialClassId: specialClass._id, studentId: record.studentId, date },
        update: { $set: { status: record.status, markedBy: req.user._id } },
        upsert: true
      }
    }));

    await SpecialClassAttendance.bulkWrite(bulkOps);
    res.json({ success: true, message: "Attendance saved successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllProgress = async (req, res) => {
  try {
    const progress = await SpecialClassProgress.find({ specialClassId: req.params.id })
      .populate("studentId", "name studentId profilePic");
    res.json({ success: true, data: progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProgress = async (req, res) => {
  try {
    const { skillsProgress, feedback } = req.body;

    const progress = await SpecialClassProgress.findOne({ specialClassId: req.params.id, studentId: req.params.studentId });
    if (!progress) return res.status(404).json({ success: false, message: "Progress record not found" });

    const specialClass = await SpecialClass.findById(req.params.id);
    if (req.user.role !== "principal" && !req.user.isTempPrincipal) {
      if (specialClass.instructorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
      }
    }

    progress.skillsProgress = skillsProgress;
    progress.feedback = feedback;
    progress.updatedBy = req.user._id;
    await progress.save();

    res.json({ success: true, message: "Progress updated successfully", data: progress });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const totalClasses = await SpecialClass.countDocuments();
    const activeClasses = await SpecialClass.countDocuments({ status: "Active" });
    const publishedClasses = await SpecialClass.countDocuments({ status: "Published" });
    const completedClasses = await SpecialClass.countDocuments({ status: "Completed" });
    const totalEnrollments = await SpecialClassEnrollment.countDocuments({ status: "Enrolled" });
    const pendingRequests = await SpecialClassEnrollment.countDocuments({ status: "Pending" });

    res.json({
      success: true,
      data: {
        totalClasses,
        activeClasses,
        publishedClasses,
        completedClasses,
        totalEnrollments,
        pendingRequests
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
