const User = require('../models/User');
const Counter = require('../models/Counter');
const Enrollment = require('../models/Enrollment');
const TeacherAssignment = require('../models/TeacherAssignment');
const Class = require('../models/Class');
const AcademicYear = require('../models/AcademicYear');


exports.getStudents = async (req, res) => {
  try {
    let students = [];
    let classesList = [];
    if (req.user.role === 'principal' || req.user.role === 'teacher') {
      const query = { role: 'student' };
      if (req.user.schoolId) query.schoolId = req.user.schoolId;
      students = await User.find(query).lean();
      classesList = await Class.find(req.user.schoolId ? { schoolId: req.user.schoolId } : {}).lean();
    }

    // Embed classLeader info into student objects to help frontend identify them easily if needed
    // But since the frontend uses classes API to check, we don't strictly need it here, but it's safe.
    res.status(200).json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.registerTuitionStudent = async (req, res) => {
  try {
    const { studentId, name, password, gender, batchId, feeAmount, feeDetails, feePeriod } = req.body;
    
    if (req.user.role !== 'teacher' && req.user.role !== 'principal') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const Section = require('../models/Section');
    const TuitionFee = require('../models/TuitionFee');

    const section = await Section.findById(batchId);
    if (!section) {
      return res.status(404).json({ success: false, message: 'Batch not found' });
    }

    const existing = await User.findOne({ studentId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with that Student ID already exists.' });
    }

    // Create user without grNumber
    const newUser = await User.create({
      name,
      studentId,
      email: `${studentId.toLowerCase()}@studymate.tuition`,
      password,
      mustChangePassword: false,
      role: 'student',
      gender,
      schoolId: req.user.schoolId
    });

    // Find class that corresponds to this section to enroll them
    const Class = require('../models/Class');
    const classDoc = await Class.findOne({ section: section.name });
    if (classDoc) {
      await Class.findByIdAndUpdate(classDoc._id, { $push: { students: newUser._id } });
      
      const AcademicYear = require('../models/AcademicYear');
      const Enrollment = require('../models/Enrollment');
      const activeYear = await AcademicYear.findOne({ status: 'active' });
      if (activeYear) {
        await Enrollment.create({
          studentId: newUser._id,
          academicYearId: activeYear._id,
          classId: classDoc._id,
          schoolId: req.user.schoolId,
          type: 'new_admission',
          status: 'active'
        });
      }
    }

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentYear = now.getFullYear();
    const period = (feePeriod === 'Yearly' || feePeriod === 'Year') ? 'Yearly' : 'Monthly';

    // Automatically create TuitionFee record
    await TuitionFee.create({
      studentId: newUser._id,
      batchId: section._id,
      totalAmount: Number(feeAmount),
      feePeriod: period,
      feeDetails: feeDetails || (period === 'Yearly' ? 'Yearly Tuition Fee' : 'Monthly Tuition Fee'),
      status: 'PENDING',
      lastBilledMonth: currentMonthKey,
      lastBilledYear: currentYear,
      lastResetDate: now
    });

    if (classDoc) {
      const FeeStatus = require('../models/FeeStatus');
      await FeeStatus.findOneAndUpdate(
        { studentId: newUser._id, classId: classDoc._id, term: 'current' },
        {
          $set: {
            feeStatus: 'pending',
            feePeriod: period,
            lastBilledMonth: currentMonthKey,
            lastBilledYear: currentYear,
            lastResetDate: now,
            statusUpdatedAt: now
          }
        },
        { upsert: true, new: true }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Tuition student registered and fee assigned successfully',
      data: {
        studentId: newUser.studentId
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
