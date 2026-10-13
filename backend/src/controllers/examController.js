const Exam = require('../models/Exam');
const ExamMark = require('../models/ExamMark');
const Class = require('../models/Class');
const TeacherAssignment = require('../models/TeacherAssignment');
const AcademicYear = require('../models/AcademicYear');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

const getActiveAcademicYear = async () => {
  return await AcademicYear.findOne({ status: 'active' });
};

// ---------------- Principal Endpoints ---------------- //

exports.createExam = async (req, res) => {
  try {
    if (req.user.role !== 'principal') return res.status(403).json({ success: false, message: 'Unauthorized' });

    const { academicYearId, classId, sectionId, examName, examType, instructions, schedule } = req.body;
    
    // Check overlapping or duplicate subjects in schedule
    const subjectIds = schedule.map(s => s.subjectId.toString());
    if (new Set(subjectIds).size !== subjectIds.length) {
      return res.status(400).json({ success: false, message: 'Duplicate subjects are not allowed in the same exam.' });
    }

    const newExam = await Exam.create({
      schoolId: req.user.schoolId || req.user._id,
      academicYearId,
      classId,
      sectionId,
      examName,
      examType,
      instructions,
      status: 'draft',
      schedule,
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, data: newExam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getExams = async (req, res) => {
  try {
    if (req.user.role !== 'principal') return res.status(403).json({ success: false, message: 'Unauthorized' });

    const exams = await Exam.find({ schoolId: req.user.schoolId || req.user._id })
      .populate('academicYearId', 'name')
      .populate('classId', 'className standard section')
      .populate('sectionId', 'name')
      .populate('schedule.subjectId', 'name code')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId)
      .populate('academicYearId', 'name')
      .populate('classId', 'className standard section')
      .populate('sectionId', 'name')
      .populate('schedule.subjectId', 'name code');

    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    
    // Quick auth check for school
    if (exam.schoolId && exam.schoolId.toString() !== (req.user.schoolId || req.user._id).toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.json({ success: true, data: exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateExam = async (req, res) => {
  try {
    if (req.user.role !== 'principal') return res.status(403).json({ success: false, message: 'Unauthorized' });

    const { examName, examType, instructions, schedule } = req.body;
    
    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (exam.status === 'cancelled') return res.status(400).json({ success: false, message: 'Cannot edit cancelled exam' });

    exam.examName = examName || exam.examName;
    exam.examType = examType || exam.examType;
    exam.instructions = instructions !== undefined ? instructions : exam.instructions;
    if (schedule) {
      const subjectIds = schedule.map(s => s.subjectId.toString());
      if (new Set(subjectIds).size !== subjectIds.length) {
        return res.status(400).json({ success: false, message: 'Duplicate subjects are not allowed.' });
      }
      exam.schedule = schedule;
    }

    await exam.save();
    res.json({ success: true, data: exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.publishExam = async (req, res) => {
  try {
    if (req.user.role !== 'principal') return res.status(403).json({ success: false, message: 'Unauthorized' });
    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    exam.status = 'published';
    exam.publishedAt = new Date();
    await exam.save();

    // Trigger Notification ideally...
    res.json({ success: true, data: exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.cancelExam = async (req, res) => {
  try {
    if (req.user.role !== 'principal') return res.status(403).json({ success: false, message: 'Unauthorized' });
    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    exam.status = 'cancelled';
    await exam.save();

    res.json({ success: true, data: exam });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteExam = async (req, res) => {
  try {
    if (req.user.role !== 'principal') return res.status(403).json({ success: false, message: 'Unauthorized' });
    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    if (exam.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Only draft exams can be deleted' });
    }

    await Exam.findByIdAndDelete(req.params.examId);
    res.json({ success: true, message: 'Exam deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- Teacher Endpoints ---------------- //

exports.getTeacherExams = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ success: false, message: 'Unauthorized' });

    const activeYear = await getActiveAcademicYear();
    if (!activeYear) return res.json({ success: true, data: [] });

    // Find teacher's assigned classes/sections
    const assignments = await TeacherAssignment.find({ teacherId: req.user._id });
    
    // Find published/completed/cancelled exams for those classes
    const classIds = []; // Get all class IDs this teacher is associated with
    for (let a of assignments) {
      const cls = await Class.findOne({ standard: a.standardId, section: a.sectionId });
      // wait, Class.standard is string! 
      // let's just get the class strings from assignments:
      const std = await require('../models/Standard').findById(a.standardId);
      const sec = await require('../models/Section').findById(a.sectionId);
      if (std && sec) {
        const c = await Class.findOne({ className: `${std.name} - ${sec.name}` });
        if (c && !classIds.includes(c._id.toString())) {
          classIds.push(c._id.toString());
        }
      }
    }

    const exams = await Exam.find({
      academicYearId: activeYear._id,
      classId: { $in: classIds },
      status: { $ne: 'draft' }
    }).populate('classId', 'className').populate('schedule.subjectId', 'name');

    // Filter schedule to only show assigned subjects to this teacher, unless they are class teacher
    // We will just send the exams and let frontend filter or filter here
    res.json({ success: true, data: exams });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- Student Endpoints ---------------- //

exports.getStudentExams = async (req, res) => {
  try {
    const activeYear = await getActiveAcademicYear();
    if (!activeYear) return res.json({ success: true, data: [] });

    const enrollment = await Enrollment.findOne({ studentId: req.user._id, academicYearId: activeYear._id });
    if (!enrollment) return res.json({ success: true, data: [] });

    const exams = await Exam.find({
      classId: enrollment.classId,
      status: { $ne: 'draft' }
    }).populate('schedule.subjectId', 'name').sort({ 'schedule.examDate': 1 });

    res.json({ success: true, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- Parent Endpoints ---------------- //

exports.getParentChildExams = async (req, res) => {
  try {
    const { studentId } = req.params;
    const parent = await User.findById(req.user._id);
    if (!parent || parent.role !== 'parent' || !parent.children.includes(studentId)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const activeYear = await getActiveAcademicYear();
    if (!activeYear) return res.json({ success: true, data: [] });

    const enrollment = await Enrollment.findOne({ studentId, academicYearId: activeYear._id });
    if (!enrollment) return res.json({ success: true, data: [] });

    const exams = await Exam.find({
      classId: enrollment.classId,
      status: { $ne: 'draft' }
    }).populate('schedule.subjectId', 'name').sort({ 'schedule.examDate': 1 });

    res.json({ success: true, data: exams });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.enterMarks = async (req, res) => {
  try {
    if (req.user.role !== 'teacher') return res.status(403).json({ success: false, message: 'Unauthorized' });
    
    const { subjectId, marks, status } = req.body; 

    const exam = await Exam.findById(req.params.examId);
    if (!exam || exam.status === 'cancelled' || exam.status === 'draft') return res.status(404).json({ success: false, message: 'Exam not found or unavailable' });
    
    const classDoc = await Class.findById(exam.classId);
    const [standardName, sectionName] = classDoc.className.split(' - ');
    const std = await require('../models/Standard').findOne({ name: standardName });
    let sec = null;
    if (std) sec = await require('../models/Section').findOne({ name: sectionName, standardId: std._id });
    const subject = await require('../models/Subject').findById(subjectId);
    
    const isAssigned = await TeacherAssignment.findOne({
      teacherId: req.user._id,
      standardId: std?._id,
      sectionId: sec?._id,
      subject: subject?.name
    });

    const isClassTeacher = await TeacherAssignment.findOne({
      teacherId: req.user._id,
      standardId: std?._id,
      sectionId: sec?._id,
      isClassTeacher: true
    });

    if (!isAssigned && !isClassTeacher) {
      return res.status(403).json({ success: false, message: 'Unauthorized for this subject' });
    }

    const operations = marks.map(m => ({
      updateOne: {
        filter: { examId: exam._id, subjectId, studentId: m.studentId },
        update: {
          $set: {
            teacherId: req.user._id,
            marksObtained: m.marksObtained,
            isAbsent: m.isAbsent,
            remarks: m.remarks,
            status: status || 'draft'
          }
        },
        upsert: true
      }
    }));

    if (operations.length > 0) {
      await ExamMark.bulkWrite(operations);
    }

    res.json({ success: true, message: 'Marks saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getExamMarks = async (req, res) => {
  try {
    const { subjectId } = req.query;
    if (!subjectId) return res.status(400).json({ success: false, message: 'Subject ID is required' });

    const marks = await ExamMark.find({ examId: req.params.examId, subjectId }).populate('studentId', 'name studentId');
    res.json({ success: true, data: marks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStudentReportCard = async (req, res) => {
  try {
    const studentId = req.user._id;
    const activeYear = await getActiveAcademicYear();
    if (!activeYear) return res.json({ success: true, data: [] });

    const enrollment = await Enrollment.findOne({ studentId, academicYearId: activeYear._id });
    if (!enrollment) return res.json({ success: true, data: [] });

    const exams = await Exam.find({
      classId: enrollment.classId,
      status: 'published'
    }).populate('schedule.subjectId', 'name').sort({ 'schedule.examDate': 1 }).lean();

    const marks = await ExamMark.find({ studentId, status: 'submitted' }).lean();

    const reportCard = exams.map(exam => {
      const examMarks = marks.filter(m => m.examId.toString() === exam._id.toString());
      const subjects = exam.schedule.map(s => {
        const mark = examMarks.find(m => m.subjectId.toString() === s.subjectId._id.toString());
        return {
          subjectId: s.subjectId._id,
          subject: s.subjectId.name,
          maxMarks: s.maxMarks,
          passingMarks: s.passingMarks,
          marksObtained: mark ? mark.marksObtained : null,
          isAbsent: mark ? mark.isAbsent : false,
          remarks: mark ? mark.remarks : '',
        };
      });
      return { _id: exam._id, examName: exam.examName, examType: exam.examType, subjects };
    });

    res.json({ success: true, data: reportCard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getParentChildReportCard = async (req, res) => {
  try {
    const { studentId } = req.params;
    const parent = await User.findById(req.user._id);
    if (!parent || parent.role !== 'parent' || !parent.children.includes(studentId)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const activeYear = await getActiveAcademicYear();
    if (!activeYear) return res.json({ success: true, data: [] });

    const enrollment = await Enrollment.findOne({ studentId, academicYearId: activeYear._id });
    if (!enrollment) return res.json({ success: true, data: [] });

    const exams = await Exam.find({
      classId: enrollment.classId,
      status: 'published'
    }).populate('schedule.subjectId', 'name').sort({ 'schedule.examDate': 1 }).lean();

    const marks = await ExamMark.find({ studentId, status: 'submitted' }).lean();

    const reportCard = exams.map(exam => {
      const examMarks = marks.filter(m => m.examId.toString() === exam._id.toString());
      const subjects = exam.schedule.map(s => {
        const mark = examMarks.find(m => m.subjectId.toString() === s.subjectId._id.toString());
        return {
          subjectId: s.subjectId._id,
          subject: s.subjectId.name,
          maxMarks: s.maxMarks,
          passingMarks: s.passingMarks,
          marksObtained: mark ? mark.marksObtained : null,
          isAbsent: mark ? mark.isAbsent : false,
          remarks: mark ? mark.remarks : '',
        };
      });
      return { _id: exam._id, examName: exam.examName, examType: exam.examType, subjects };
    });

    res.json({ success: true, data: reportCard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

