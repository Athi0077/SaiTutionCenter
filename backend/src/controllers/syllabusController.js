const SyllabusChapter = require('../models/SyllabusChapter');
const TeacherAssignment = require('../models/TeacherAssignment');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const AcademicYear = require('../models/AcademicYear');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const { getIo } = require('../utils/socket');

// Helper to get active academic year
const getActiveAcademicYear = async () => {
  return await AcademicYear.findOne({ status: 'active' });
};

exports.getTeacherSyllabus = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ success: false, message: 'Unauthorized' });
    const assignments = await TeacherAssignment.find({ teacherId: req.user._id })
      .populate('standardId', 'name')
      .populate('sectionId', 'name');

    const activeYear = await getActiveAcademicYear();
    const result = [];

    for (let assignment of assignments) {
      if (!assignment.standardId || !assignment.sectionId) continue;

      const className = `${assignment.standardId.name} - ${assignment.sectionId.name}`;
      let classDoc = await Class.findOne({ className });
      if (!classDoc) {
        classDoc = await Class.findOne({ standard: assignment.standardId.name, section: assignment.sectionId.name });
      }
      if (!classDoc) continue;

      const subj = assignment.subject || (assignment.isClassTeacher ? "Class Teacher" : null);
      if (!subj) continue;

      const filter = {
        classId: classDoc._id,
        subject: subj
      };
      if (activeYear) {
        filter.academicYearId = activeYear._id;
      }

      const chapters = await SyllabusChapter.find(filter);
      const total = chapters.length;
      const completed = chapters.filter(c => c.status === 'Completed').length;
      
      result.push({
        assignmentId: assignment._id,
        classId: classDoc._id,
        className: classDoc.className,
        subject: subj,
        progress: {
          total,
          completed,
          pending: total - completed,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0
        }
      });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSyllabusChapters = async (req, res) => {
  try {
    const { classId, subjectId: subject } = req.params; // Using subject string as subjectId param
    const activeYear = await getActiveAcademicYear();
    
    // Auth check: if teacher, verify assignment
    if (req.user.role === 'teacher') {
      const classDoc = await Class.findById(classId);
      if (!classDoc) return res.status(404).json({ success: false, message: 'Class not found' });
      
      const teacherAssignments = await TeacherAssignment.find({ teacherId: req.user._id })
        .populate('standardId', 'name')
        .populate('sectionId', 'name');

      const isAssigned = teacherAssignments.some(a => {
        if (!a.standardId || !a.sectionId) return false;
        const matchClass = (a.standardId.name === classDoc.standard && a.sectionId.name === classDoc.section) ||
                           (`${a.standardId.name} - ${a.sectionId.name}` === classDoc.className);
        if (!matchClass) return false;
        if (a.isClassTeacher) return true;
        if (a.subject === subject) return true;
        if (!a.subject && subject === 'Class Teacher') return true;
        return false;
      });

      if (!isAssigned) {
        return res.status(403).json({ success: false, message: 'You are not assigned to this class and subject.' });
      }
    }

    const filter = {
      classId,
      subject
    };
    if (activeYear) {
      filter.academicYearId = activeYear._id;
    }

    const chapters = await SyllabusChapter.find(filter)
      .sort({ chapterNumber: 1 })
      .populate('completedBy', 'name');

    res.json({ success: true, data: chapters });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createChapter = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ success: false, message: 'Unauthorized' });
    
    const { classId, subject, chapterNumber, chapterTitle, description, learningObjectives, estimatedCompletionDate, referenceMaterials } = req.body;
    const activeYear = await getActiveAcademicYear();
    
    const classDoc = await Class.findById(classId);
    if (!classDoc) return res.status(404).json({ success: false, message: 'Class not found' });
    
    const teacherAssignments = await TeacherAssignment.find({ teacherId: req.user._id })
      .populate('standardId', 'name')
      .populate('sectionId', 'name');

    const isAssigned = teacherAssignments.some(a => {
      if (!a.standardId || !a.sectionId) return false;
      const matchClass = (a.standardId.name === classDoc.standard && a.sectionId.name === classDoc.section) ||
                         (`${a.standardId.name} - ${a.sectionId.name}` === classDoc.className);
      if (!matchClass) return false;
      if (a.isClassTeacher) return true;
      if (a.subject === subject) return true;
      if (!a.subject && subject === 'Class Teacher') return true;
      return false;
    });

    if (!isAssigned) return res.status(403).json({ success: false, message: 'Unauthorized for this class and subject.' });

    const newChapter = await SyllabusChapter.create({
      schoolId: req.user.schoolId,
      classId,
      subject,
      academicYearId: activeYear?._id,
      chapterNumber,
      chapterTitle,
      description,
      learningObjectives,
      estimatedCompletionDate: estimatedCompletionDate || undefined,
      referenceMaterials,
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, data: newChapter });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Chapter number already exists for this subject.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateChapter = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ success: false, message: 'Unauthorized' });
    const chapter = await SyllabusChapter.findById(req.params.chapterId);
    if (!chapter) return res.status(404).json({ success: false, message: 'Not found' });
    
    Object.assign(chapter, req.body);
    await chapter.save();
    res.json({ success: true, data: chapter });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateChapterStatus = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ success: false, message: 'Unauthorized' });
    const chapter = await SyllabusChapter.findById(req.params.chapterId);
    if (!chapter) return res.status(404).json({ success: false, message: 'Not found' });

    chapter.status = req.body.status;
    if (chapter.status === 'Completed') {
      chapter.completedAt = new Date();
      chapter.completedBy = req.user._id;
    } else {
      chapter.completedAt = null;
      chapter.completedBy = null;
    }
    await chapter.save();

    const io = getIo();
    if (io) {
      io.emit('syllabus_updated', { classId: chapter.classId, subject: chapter.subject });
    }

    res.json({ success: true, data: chapter });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteChapter = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ success: false, message: 'Unauthorized' });
    await SyllabusChapter.findByIdAndDelete(req.params.chapterId);
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStudentSyllabusProgress = async (req, res) => {
  try {
    const activeYear = await getActiveAcademicYear();
    if (!activeYear) return res.status(404).json({ success: false, message: 'No active academic year' });

    const enrollment = await Enrollment.findOne({ studentId: req.user._id, academicYearId: activeYear._id });
    if (!enrollment) return res.status(404).json({ success: false, message: 'Not enrolled in current year' });

    // Find distinct subjects with syllabus for this class
    const chapters = await SyllabusChapter.find({ classId: enrollment.classId, academicYearId: activeYear._id });
    
    let totalChaptersOverall = chapters.length;
    let completedOverall = 0;

    const subjectMap = {};
    for (let c of chapters) {
      if (!subjectMap[c.subject]) {
        subjectMap[c.subject] = { subject: c.subject, total: 0, completed: 0, pending: 0, percentage: 0 };
      }
      subjectMap[c.subject].total++;
      if (c.status === 'Completed') {
        subjectMap[c.subject].completed++;
        completedOverall++;
      }
    }

    const subjects = Object.values(subjectMap).map(s => {
      s.pending = s.total - s.completed;
      s.percentage = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
      return s;
    });

    res.json({
      success: true,
      data: {
        subjects,
        overall: {
          total: totalChaptersOverall,
          completed: completedOverall,
          pending: totalChaptersOverall - completedOverall,
          percentage: totalChaptersOverall > 0 ? Math.round((completedOverall / totalChaptersOverall) * 100) : 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSubjectSyllabus = async (req, res) => {
  try {
    const activeYear = await getActiveAcademicYear();
    const enrollment = await Enrollment.findOne({ studentId: req.user._id, academicYearId: activeYear?._id });
    if (!enrollment) return res.status(404).json({ success: false, message: 'Not enrolled' });

    const chapters = await SyllabusChapter.find({
      classId: enrollment.classId,
      subject: req.params.subjectId, // which is subject name here
      academicYearId: activeYear?._id
    }).sort({ chapterNumber: 1 });

    res.json({ success: true, data: chapters });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getParentSyllabusProgress = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    
    // Auth check: Is this parent's child?
    const parent = await User.findById(req.user._id);
    if (!parent || parent.role !== 'parent') return res.status(403).json({ success: false, message: 'Unauthorized' });
    if (!parent.children.includes(studentId)) {
      return res.status(403).json({ success: false, message: 'Not your child' });
    }

    const activeYear = await getActiveAcademicYear();
    if (!activeYear) return res.status(404).json({ success: false, message: 'No active academic year' });

    const enrollment = await Enrollment.findOne({ studentId, academicYearId: activeYear._id });
    if (!enrollment) return res.status(404).json({ success: false, message: 'Child not enrolled in current year' });

    const chapters = await SyllabusChapter.find({ classId: enrollment.classId, academicYearId: activeYear._id }).sort({ chapterNumber: 1 });
    
    let totalChaptersOverall = chapters.length;
    let completedOverall = 0;

    const subjectMap = {};
    for (let c of chapters) {
      if (!subjectMap[c.subject]) {
        subjectMap[c.subject] = { subject: c.subject, total: 0, completed: 0, pending: 0, percentage: 0, chapters: [] };
      }
      subjectMap[c.subject].total++;
      if (c.status === 'Completed') {
        subjectMap[c.subject].completed++;
        completedOverall++;
      }
      subjectMap[c.subject].chapters.push(c);
    }

    const subjects = Object.values(subjectMap).map(s => {
      s.pending = s.total - s.completed;
      s.percentage = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
      return s;
    });

    res.json({
      success: true,
      data: {
        subjects,
        overall: {
          total: totalChaptersOverall,
          completed: completedOverall,
          pending: totalChaptersOverall - completedOverall,
          percentage: totalChaptersOverall > 0 ? Math.round((completedOverall / totalChaptersOverall) * 100) : 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
