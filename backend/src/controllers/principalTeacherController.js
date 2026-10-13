const User = require("../models/User");
const TeacherAssignment = require("../models/TeacherAssignment");
const bcrypt = require("bcryptjs");

// @desc    Get all teachers
// @route   GET /api/principal/teachers
// @access  Private (Principal)
const getTeachers = async (req, res) => {
  try {
    const filter = { role: "teacher" };
    if (req.user.schoolId) filter.schoolId = req.user.schoolId;

    const teachers = await User.find(filter).select("-password").sort({ createdAt: -1 });
    
    // Fetch assignments for these teachers
    const assignments = await TeacherAssignment.find({ teacherId: { $in: teachers.map(t => t._id) } })
      .populate('standardId', 'name')
      .populate('sectionId', 'name');

    const teachersWithAssignments = teachers.map(t => {
      const assigned = assignments.filter(a => a.teacherId.toString() === t._id.toString());
      return {
        ...t.toObject(),
        classesAssigned: assigned.map(a => `${a.standardId?.name} - ${a.sectionId?.name}`),
        subjectsAssigned: assigned.map(a => a.subject).filter(Boolean)
      };
    });

    res.json({ success: true, data: teachersWithAssignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new teacher
// @route   POST /api/principal/teachers
// @access  Private (Principal)
const createTeacher = async (req, res) => {
  try {
    const { name, email, mobileNumber, phone, password } = req.body;
    const mobile = (mobileNumber || phone || "").trim();
    const cleanEmail = email ? email.trim().toLowerCase() : undefined;

    if (!name || !mobile || !password) {
      return res.status(400).json({ success: false, message: "Name, mobile number, and password are required" });
    }

    const query = [{ mobileNumber: mobile }, { phone: mobile }];
    if (cleanEmail) query.push({ email: cleanEmail });

    const userExists = await User.findOne({ $or: query });
    if (userExists) {
      return res.status(400).json({ success: false, message: "User with this mobile number or email already exists" });
    }

    const newTeacher = await User.create({
      name,
      email: cleanEmail || undefined,
      mobileNumber: mobile,
      phone: mobile,
      password,
      role: "teacher",
      status: "active",
      schoolId: req.user.schoolId || null,
    });

    const teacherData = newTeacher.toObject();
    delete teacherData.password;

    res.status(201).json({ success: true, message: "Teacher created successfully", data: teacherData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single teacher
// @route   GET /api/principal/teachers/:id
// @access  Private (Principal)
const getTeacherById = async (req, res) => {
  try {
    const teacher = await User.findById(req.params.id).select("-password");
    if (!teacher || teacher.role !== "teacher") {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    if (req.user.schoolId && teacher.schoolId?.toString() !== req.user.schoolId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to access this teacher" });
    }

    const classes = await Class.find({ teacherId: teacher._id });

    res.json({ success: true, data: { ...teacher.toObject(), assignments: classes } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update teacher details
// @route   PUT /api/principal/teachers/:id
// @access  Private (Principal)
const updateTeacher = async (req, res) => {
  try {
    const { name, email, mobileNumber, phone, password } = req.body;
    const mobile = (mobileNumber || phone || "").trim();
    const cleanEmail = email ? email.trim().toLowerCase() : undefined;
    
    const teacher = await User.findById(req.params.id);
    if (!teacher || teacher.role !== "teacher") {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    if (req.user.schoolId && teacher.schoolId?.toString() !== req.user.schoolId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to access this teacher" });
    }

    if (cleanEmail && cleanEmail !== teacher.email) {
      const emailExists = await User.findOne({ email: cleanEmail, _id: { $ne: teacher._id } });
      if (emailExists) {
        return res.status(400).json({ success: false, message: "Email already in use" });
      }
      teacher.email = cleanEmail;
    } else if (email === "") {
      teacher.email = undefined;
    }

    if (mobile && mobile !== teacher.mobileNumber && mobile !== teacher.phone) {
      const mobileExists = await User.findOne({
        $or: [{ mobileNumber: mobile }, { phone: mobile }],
        _id: { $ne: teacher._id }
      });
      if (mobileExists) {
        return res.status(400).json({ success: false, message: "Mobile number already in use" });
      }
      teacher.mobileNumber = mobile;
      teacher.phone = mobile;
    }

    if (name) teacher.name = name;
    if (password) {
      teacher.password = password;
    }
    await teacher.save();

    const teacherData = teacher.toObject();
    delete teacherData.password;

    res.json({ success: true, message: "Teacher updated successfully", data: teacherData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Activate/Deactivate teacher
// @route   PATCH /api/principal/teachers/:id/status
// @access  Private (Principal)
const updateTeacherStatus = async (req, res) => {
  try {
    const { status } = req.body; // active, blocked
    
    if (!["active", "blocked", "inactive"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const teacher = await User.findById(req.params.id);
    if (!teacher || teacher.role !== "teacher") {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    if (req.user.schoolId && teacher.schoolId?.toString() !== req.user.schoolId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to access this teacher" });
    }

    teacher.status = status;
    await teacher.save();

    res.json({ success: true, message: "Teacher status updated", data: teacher.status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a teacher account
// @route   DELETE /api/principal/teachers/:id
// @access  Private (Principal)
const deleteTeacher = async (req, res) => {
  try {
    const teacher = await User.findById(req.params.id);
    if (!teacher || teacher.role !== "teacher") {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    if (req.user.schoolId && teacher.schoolId?.toString() !== req.user.schoolId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to access this teacher" });
    }

    await User.findByIdAndDelete(req.params.id);
    
    // Remove them from teacher assignments
    await TeacherAssignment.deleteMany({ teacherId: req.params.id });

    res.json({ success: true, message: "Teacher deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTeachers,
  createTeacher,
  getTeacherById,
  updateTeacher,
  updateTeacherStatus,
  deleteTeacher
};
