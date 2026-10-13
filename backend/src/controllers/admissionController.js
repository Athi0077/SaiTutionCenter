const User = require("../models/User");
const Enrollment = require("../models/Enrollment");

// @desc    Admit a student (new or existing)
// @route   POST /api/admissions
// @access  Private (Principal only)
const admitStudent = async (req, res) => {
  try {
    const { 
      studentId, // Optional: if existing student
      name, email, password, // If new student
      academicYearId, classId, rollNumber 
    } = req.body;

    let targetStudentId = studentId;

    if (!targetStudentId) {
      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "Name, email, and password are required for a new student" });
      }

      // Check if email exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: "User with this email already exists. Use the existing student flow." });
      }

      let tempPassword = password;
      if (!tempPassword) {
        const generateSecureTempPassword = require("../utils/generatePassword");
        tempPassword = generateSecureTempPassword();
      }

      const newUser = await User.create({
        name,
        email,
        password: tempPassword,
        mustChangePassword: true,
        role: "student"
      });
      targetStudentId = newUser._id;
    }

    // Check if already enrolled in this academic year
    const existingEnrollment = await Enrollment.findOne({ studentId: targetStudentId, academicYearId });
    if (existingEnrollment) {
      return res.status(400).json({ success: false, message: "Student is already enrolled in this academic year" });
    }

    const enrollment = await Enrollment.create({
      studentId: targetStudentId,
      academicYearId,
      classId,
      status: "active",
      type: "new_admission",
      rollNumber
    });

    res.status(201).json({ success: true, message: "Student admitted successfully", data: enrollment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  admitStudent
};
