const Subject = require("../models/Subject");
const Class = require("../models/Class");

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private
// Default subjects to seed
const DEFAULT_SUBJECTS = [
  { name: 'English',  code: 'ENG' },
  { name: 'Tamil',    code: 'TAM' },
  { name: 'Maths',    code: 'MAT' },
  { name: 'Science',  code: 'SCI' },
  { name: 'Social',   code: 'SOC' },
];

// @desc    Create a subject
// @route   POST /api/subjects
// @access  Private (Principal)
const createSubject = async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Name and code are required' });
    }
    const existing = await Subject.findOne({ $or: [{ name }, { code }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Subject with this name or code already exists' });
    }
    const subject = await Subject.create({ name, code, status: 'active' });
    res.status(201).json({ success: true, message: 'Subject created', data: subject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Seed default subjects if none exist
// @route   POST /api/subjects/seed-defaults
// @access  Private (Principal)
const seedDefaultSubjects = async (req, res) => {
  try {
    const created = [];
    for (const subj of DEFAULT_SUBJECTS) {
      const exists = await Subject.findOne({ name: subj.name });
      if (!exists) {
        const newSubj = await Subject.create({ ...subj, status: 'active' });
        created.push(newSubj);
      }
    }
    const allSubjects = await Subject.find({ status: 'active' });
    res.json({ success: true, message: `${created.length} subject(s) created`, data: allSubjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private
const getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ status: "active" });
    res.json({ success: true, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign subject to class
// @route   POST /api/classes/:classId/subjects
// @access  Private (Teacher only)
const assignSubjectToClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { subjectId } = req.body;

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    if (classData.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    if (classData.subjects.includes(subjectId)) {
      return res.status(400).json({ success: false, message: "Subject already assigned to this class" });
    }

    classData.subjects.push(subjectId);
    await classData.save();

    res.json({ success: true, message: "Subject assigned successfully", data: classData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get subjects for a specific class
// @route   GET /api/classes/:classId/subjects
// @access  Private
const getClassSubjects = async (req, res) => {
  try {
    const { classId } = req.params;
    const classData = await Class.findById(classId).populate("subjects");
    
    if (!classData) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    let allowedSubjects = classData.subjects;

    if (req.user.role === "teacher") {
      const TeacherAssignment = require("../models/TeacherAssignment");
      const Standard = require("../models/Standard");
      const Section = require("../models/Section");
      
      const standard = await Standard.findOne({ name: classData.standard });
      const section = await Section.findOne({ name: classData.section, standardId: standard?._id });
      
      if (standard && section) {
        const assignments = await TeacherAssignment.find({
          teacherId: req.user._id,
          standardId: standard._id,
          sectionId: section._id
        });
        
        const teacherSubjects = assignments.map(a => a.subject).filter(s => s);
        
        if (teacherSubjects.length > 0) {
          allowedSubjects = classData.subjects.filter(sub => 
            teacherSubjects.some(ts => ts.toLowerCase() === sub.name.toLowerCase())
          );
        }
      }
    }

    res.json({ success: true, data: allowedSubjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllSubjects,
  createSubject,
  seedDefaultSubjects,
  assignSubjectToClass,
  getClassSubjects,
};
