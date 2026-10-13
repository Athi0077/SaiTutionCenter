const Timetable = require("../models/Timetable");
const Class = require("../models/Class");
const AcademicYear = require("../models/AcademicYear");

// @desc    Create a timetable
// @route   POST /api/timetable
// @access  Private (Teacher)
const createTimetable = async (req, res) => {
  try {
    const { classId, academicYearId, workingDays, periods } = req.body;

    if (periods && Array.isArray(periods)) {
      periods.forEach(p => {
        if (p.subjectId === "") p.subjectId = null;
        if (p.subjectTeacherId === "") p.subjectTeacherId = null;
      });
    }

    // Verify teacher is the class teacher
    const cls = await Class.findById(classId);
    if (!cls) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    if (cls.teacherId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You are not the class teacher for this class." });
    }

    // Ensure timetable doesn't already exist
    const existing = await Timetable.findOne({ classId, academicYearId });
    if (existing) {
      return res.status(400).json({ success: false, message: "Timetable already exists for this class and academic year." });
    }

    const timetable = await Timetable.create({
      academicYearId,
      classId,
      classTeacherId: req.user._id,
      workingDays,
      periods,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    res.status(201).json({ success: true, message: "Timetable created successfully", data: timetable });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get timetables for teacher's assigned classes
// @route   GET /api/timetable/my-classes
// @access  Private (Teacher)
const getMyTimetables = async (req, res) => {
  try {
    // A teacher can view timetables of classes they are the class teacher of
    const timetables = await Timetable.find({ classTeacherId: req.user._id })
      .populate('academicYearId', 'year name isActive')
      .populate('classId', 'className standard section');

    res.json({ success: true, data: timetables });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get timetable by class and section
// @route   GET /api/timetable/class/:classId
// @access  Private
const getClassTimetable = async (req, res) => {
  try {
    const { classId } = req.params;

    // We can also allow filtering by academic year, but by default we return the active one
    const activeYear = await AcademicYear.findOne({ status: 'active' });
    
    let query = { classId };
    if (activeYear) {
      query.academicYearId = activeYear._id;
    }

    const timetable = await Timetable.findOne(query)
      .populate('academicYearId', 'year name isActive')
      .populate('classId', 'className standard section')
      .populate('periods.subjectTeacherId', 'name');

    if (!timetable) {
      return res.status(200).json({ success: true, data: null, message: "Timetable not found for this class." });
    }

    // Role-based access checks
    if (req.user.role === 'student') {
      const cls = await Class.findById(classId);
      if (!cls || !cls.students.includes(req.user._id)) {
        return res.status(403).json({ success: false, message: "You can only view your own class timetable." });
      }
    } else if (req.user.role === 'parent') {
      // In a real scenario, check if the parent's children are in this class.
      // Assuming this is handled or allowed generally for parents to view
      const User = require('../models/User');
      const parent = await User.findById(req.user._id).populate('children');
      const childIds = parent.children.map(c => c._id.toString());
      const cls = await Class.findById(classId);
      const hasChildInClass = cls && cls.students.some(s => childIds.includes(s.toString()));
      if (!hasChildInClass) {
        return res.status(403).json({ success: false, message: "You can only view your child's class timetable." });
      }
    }

    res.json({ success: true, data: timetable });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a timetable
// @route   PUT /api/timetable/:id
// @access  Private (Teacher)
const updateTimetable = async (req, res) => {
  try {
    const { workingDays, periods } = req.body;
    
    if (periods && Array.isArray(periods)) {
      periods.forEach(p => {
        if (p.subjectId === "") p.subjectId = null;
        if (p.subjectTeacherId === "") p.subjectTeacherId = null;
      });
    }
    
    const timetable = await Timetable.findById(req.params.id);
    if (!timetable) {
      return res.status(404).json({ success: false, message: "Timetable not found" });
    }

    if (timetable.classTeacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You are not authorized to edit this timetable." });
    }

    timetable.workingDays = workingDays || timetable.workingDays;
    timetable.periods = periods || timetable.periods;
    timetable.updatedBy = req.user._id;

    await timetable.save();

    res.json({ success: true, message: "Timetable updated successfully", data: timetable });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a timetable
// @route   DELETE /api/timetable/:id
// @access  Private (Teacher)
const deleteTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);
    if (!timetable) {
      return res.status(404).json({ success: false, message: "Timetable not found" });
    }

    if (timetable.classTeacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You are not authorized to delete this timetable." });
    }

    await Timetable.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Timetable deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get logged-in teacher's timetable
// @route   GET /api/timetable/teacher
// @access  Private (Teacher)
const getTeacherTimetable = async (req, res) => {
  try {
    const activeYear = await AcademicYear.findOne({ status: 'active' });
    let query = { "periods.subjectTeacherId": req.user._id };
    if (activeYear) {
      query.academicYearId = activeYear._id;
    }

    const timetables = await Timetable.find(query)
      .populate('academicYearId', 'year name isActive')
      .populate('classId', 'className standard section')
      .populate('periods.subjectTeacherId', 'name');

    console.log('[TEACHER TIMETABLE] authenticated user:', req.user._id, req.user.email);
    console.log('[TEACHER TIMETABLE] teacher ID:', req.user._id);
    console.log('[TEACHER TIMETABLE] query:', query);
    console.log('[TEACHER TIMETABLE] records found:', timetables.length);

    let teacherPeriods = [];
    let seenMap = new Set();
    
    timetables.forEach(timetable => {
      timetable.periods.forEach(period => {
        const isMyPeriod = period.subjectTeacherId && period.subjectTeacherId._id.toString() === req.user._id.toString();
        const isBreakOrLunch = period.type === 'break' || period.type === 'lunch';
        
        if (isMyPeriod || isBreakOrLunch) {
          const uniqueKey = `${period.day}-${period.startTime}-${period.endTime}-${period.type}-${isMyPeriod ? timetable.classId._id : ''}`;
          if (!seenMap.has(uniqueKey)) {
            seenMap.add(uniqueKey);
            teacherPeriods.push({
              _id: period._id,
              day: period.day,
              periodNumber: period.periodNumber,
              startTime: period.startTime,
              endTime: period.endTime,
              type: period.type,
              subject: period.subject,
              subjectId: period.subjectId,
              classInfo: isMyPeriod ? timetable.classId : null,
            });
          }
        }
      });
    });

    res.json({ success: true, data: teacherPeriods });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTimetable,
  getMyTimetables,
  getClassTimetable,
  updateTimetable,
  deleteTimetable,
  getTeacherTimetable
};
