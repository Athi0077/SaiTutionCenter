const User = require("../models/User");

// @desc    Get all pending teachers
// @route   GET /api/users/pending-teachers
// @access  Private (Principal)
const getPendingTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: "teacher", status: "pending" }).select("-password");
    res.json({ success: true, data: teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve a teacher
// @route   PATCH /api/users/:id/approve
// @access  Private (Principal)
const approveTeacher = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.status = "active";
    await user.save();

    const { createNotification } = require("../services/notificationService");
    await createNotification({
      recipientId: user._id,
      senderId: req.user._id,
      type: "account_approved",
      title: "Account Approved",
      message: "Your teacher account has been approved by the Principal.",
    });

    res.json({ success: true, message: "Teacher approved", data: user });
  } catch (error) {
    console.error("Error in approveTeacher:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reject a teacher
// @route   PATCH /api/users/:id/reject
// @access  Private (Principal)
const rejectTeacher = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.status = "blocked";
    await user.save();

    res.json({ success: true, message: "Teacher rejected", data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all active teachers
// @route   GET /api/users/active-teachers
// @access  Private (Principal)
const getActiveTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: "teacher", status: "active" }).select("-password");
    res.json({ success: true, data: teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Protect administrative & identity fields
    const protectedFields = ["role", "studentId", "grNumber", "status", "schoolId", "idCardStatus", "createdBy", "createdByRole"];
    for (const field of protectedFields) {
      if (req.body[field] !== undefined && String(req.body[field]) !== String(user[field])) {
        return res.status(403).json({ success: false, message: `Field '${field}' cannot be modified through profile update.` });
      }
    }

    if (req.body.name) user.name = req.body.name;
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({ email: req.body.email, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: "Email is already in use by another account." });
      }
      user.email = req.body.email;
    }
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    if (req.body.address !== undefined) user.address = req.body.address;
    
    // Date of Birth validation & update
    if (req.body.dateOfBirth !== undefined) {
      if (req.body.dateOfBirth === "" || req.body.dateOfBirth === null) {
        user.dateOfBirth = undefined;
      } else {
        const dob = new Date(req.body.dateOfBirth);
        if (isNaN(dob.getTime())) {
          return res.status(400).json({ success: false, message: "Invalid Date of Birth" });
        }
        if (dob > new Date()) {
          return res.status(400).json({ success: false, message: "Date of Birth cannot be in the future" });
        }
        user.dateOfBirth = dob;
      }
    }

    // Blood Group validation & update
    if (req.body.bloodGroup !== undefined) {
      const allowedBloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown / Not specified"];
      if (req.body.bloodGroup && !allowedBloodGroups.includes(req.body.bloodGroup)) {
        return res.status(400).json({ success: false, message: "Invalid Blood Group selection" });
      }
      user.bloodGroup = req.body.bloodGroup || "Unknown / Not specified";
    }

    // Password update
    if (req.body.password) {
      user.password = req.body.password;
    }

    await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        status: user.status,
        profilePic: user.profilePic,
        dateOfBirth: user.dateOfBirth,
        bloodGroup: user.bloodGroup
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all students
// @route   GET /api/users/students
// @access  Private
const getStudents = async (req, res) => {
  try {
    let query = { role: "student" };
    if (req.user && req.user.role === "teacher") {
      const { getTeacherClasses } = require("../utils/teacherClassHelper");
      const teacherClasses = await getTeacherClasses(req.user._id, "students");
      const studentIds = teacherClasses.flatMap(c => c.students || []);
      query = { role: "student", _id: { $in: studentIds } };
    }
    const students = await User.find(query).select("-password");
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload profile picture
// @route   POST /api/users/profile/upload
// @access  Private
const uploadProfilePic = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file provided" });
    }
    const user = await User.findById(req.user._id);
    user.profilePic = req.file.path; // Cloudinary URL
    await user.save();
    res.json({ success: true, url: req.file.path });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete profile picture
// @route   DELETE /api/users/profile/upload
// @access  Private
const deleteProfilePic = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.profilePic = "";
    await user.save();
    res.json({ success: true, message: "Profile picture removed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Teacher resets student password
// @route   POST /api/users/students/:id/reset-password
// @access  Private (Teacher)
const resetStudentPassword = async (req, res) => {
  try {
    const studentId = req.params.id;
    const Class = require("../models/Class");
    const SecurityEvent = require("../models/SecurityEvent");
    const crypto = require("crypto");

    // Verify teacher is actually assigned to the student's class
    const studentClass = await Class.findOne({ students: studentId });
    if (!studentClass) {
      return res.status(404).json({ success: false, message: "Student is not enrolled in any class." });
    }

    let isStudentInTeacherClass = false;
    if (studentClass.teacherId && studentClass.teacherId.toString() === req.user._id.toString()) {
      isStudentInTeacherClass = true;
    } else {
      const TeacherAssignment = require("../models/TeacherAssignment");
      const assignments = await TeacherAssignment.find({ teacherId: req.user._id })
        .populate("standardId", "name")
        .populate("sectionId", "name");
      
      isStudentInTeacherClass = assignments.some(a => 
        a.standardId?.name === studentClass.standard && 
        a.sectionId?.name === studentClass.section
      );
    }

    if (!isStudentInTeacherClass) {
      return res.status(403).json({ success: false, message: "You are not authorized to reset this student's password." });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== "student") {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    // Generate secure temp password
    const generateSecureTempPassword = require("../utils/generatePassword");
    const tempPassword = generateSecureTempPassword();

    // Update student
    student.password = tempPassword;
    student.mustChangePassword = true;
    student.sessionVersion = (student.sessionVersion || 1) + 1;
    await student.save();

    // Log security event
    await SecurityEvent.create({
      actorId: req.user._id,
      targetId: student._id,
      eventType: "password_reset",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    res.json({
      success: true,
      message: "Password reset successfully.",
      tempPassword
    });
  } catch (error) {
    console.error("Error in resetStudentPassword:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Save FCM Token
// @route   POST /api/users/fcm-token
// @access  Private
const saveFCMToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: "Token is required" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (!user.fcmTokens) {
      user.fcmTokens = [];
    }
    
    if (!user.fcmTokens.includes(token)) {
      user.fcmTokens.push(token);
      await user.save();
    }

    res.json({ success: true, message: "Token saved successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Test Push Notification
// @route   POST /api/users/test-notification
// @access  Private
const testNotification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      return res.status(400).json({ success: false, message: "No FCM tokens found for user. Please allow notifications first." });
    }

    const admin = require("../config/firebaseInit");
    
    const payload = {
      notification: {
        title: "Test Notification 🚀",
        body: "Hello! Web Push Notifications are working perfectly!",
      }
    };

    const response = await admin.messaging().sendToDevice(user.fcmTokens, payload);
    
    res.json({ 
      success: true, 
      message: "Test notification sent!",
      response: response
    });
  } catch (error) {
    console.error("FCM Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPendingTeachers,
  approveTeacher,
  rejectTeacher,
  getActiveTeachers,
  updateProfile,
  getStudents,
  uploadProfilePic,
  deleteProfilePic,
  resetStudentPassword,
  saveFCMToken,
  testNotification
};
