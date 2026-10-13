const AcademicYear = require("../models/AcademicYear");
const Class = require("../models/Class");
const Enrollment = require("../models/Enrollment");
const User = require("../models/User");

// @desc    Get all academic years
// @route   GET /api/academic-years
// @access  Private
const getAcademicYears = async (req, res) => {
  try {
    const years = await AcademicYear.find().sort({ startDate: -1 });
    res.json({ success: true, data: years });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single academic year
// @route   GET /api/academic-years/:id
// @access  Private
const getAcademicYearById = async (req, res) => {
  try {
    const year = await AcademicYear.findById(req.params.id);
    if (!year) {
      return res.status(404).json({ success: false, message: "Academic year not found" });
    }
    res.json({ success: true, data: year });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create next academic year
// @route   POST /api/academic-years
// @access  Private (Principal only)
const createAcademicYear = async (req, res) => {
  try {
    const { name, startDate, endDate } = req.body;

    // Check for overlap or duplicate names
    const existing = await AcademicYear.findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, message: "An academic year with this name already exists" });
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ success: false, message: "End date must be after start date" });
    }

    const newYear = await AcademicYear.create({
      name,
      startDate,
      endDate,
      status: "upcoming"
    });

    res.status(201).json({ success: true, message: "Academic Year created", data: newYear });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update an academic year
// @route   PUT /api/academic-years/:id
// @access  Private (Principal only)
const updateAcademicYear = async (req, res) => {
  try {
    const { name, startDate, endDate, status } = req.body;
    const targetYear = await AcademicYear.findById(req.params.id);
    
    if (!targetYear) {
      return res.status(404).json({ success: false, message: "Academic year not found" });
    }

    // Check name duplication if name is being changed
    if (name && name !== targetYear.name) {
      const existing = await AcademicYear.findOne({ name });
      if (existing) {
        return res.status(400).json({ success: false, message: "An academic year with this name already exists" });
      }
    }

    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ success: false, message: "End date must be after start date" });
    }

    // If changing to active, ensure others are completed
    if (status === "active" && targetYear.status !== "active") {
      await AcademicYear.updateMany({ status: "active" }, { status: "completed" });
    }

    const updatedYear = await AcademicYear.findByIdAndUpdate(
      req.params.id,
      { name, startDate, endDate, status },
      { new: true, runValidators: true }
    );

    res.json({ success: true, message: "Academic year updated", data: updatedYear });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete an academic year
// @route   DELETE /api/academic-years/:id
// @access  Private (Principal only)
const deleteAcademicYear = async (req, res) => {
  try {
    const targetYear = await AcademicYear.findById(req.params.id);
    
    if (!targetYear) {
      return res.status(404).json({ success: false, message: "Academic year not found" });
    }

    if (targetYear.status === "active") {
      return res.status(400).json({ success: false, message: "Cannot delete the active academic year" });
    }

    // Optional: check if there are enrollments tied to this academic year
    const enrollmentsCount = await Enrollment.countDocuments({ academicYearId: req.params.id });
    if (enrollmentsCount > 0) {
      return res.status(400).json({ success: false, message: "Cannot delete academic year with existing enrollments" });
    }

    await targetYear.deleteOne();
    res.json({ success: true, message: "Academic year deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Activate an academic year
// @route   PUT /api/academic-years/:id/activate
// @access  Private (Principal only)
const activateAcademicYear = async (req, res) => {
  try {
    const targetYear = await AcademicYear.findById(req.params.id);
    if (!targetYear) return res.status(404).json({ success: false, message: "Academic year not found" });

    // Ensure no other year is active
    await AcademicYear.updateMany({ status: "active" }, { status: "completed" });
    targetYear.status = "active";
    await targetYear.save();

    // Migration Strategy: Load all Enrollments for this target year
    const activeEnrollments = await Enrollment.find({ academicYearId: targetYear._id, status: "active" });
    
    // Group them by ClassId
    const classToStudentsMap = {};
    for (const enr of activeEnrollments) {
      if (!classToStudentsMap[enr.classId]) {
        classToStudentsMap[enr.classId] = [];
      }
      classToStudentsMap[enr.classId].push(enr.studentId);
    }

    // Clear all existing students in Classes
    await Class.updateMany({}, { students: [] });

    // Push new students to Classes
    for (const [classId, studentIds] of Object.entries(classToStudentsMap)) {
      await Class.findByIdAndUpdate(classId, { students: studentIds });
    }

    res.json({ success: true, message: "Academic year activated and class rosters updated", data: targetYear });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAcademicYears,
  getAcademicYearById,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  activateAcademicYear
};
