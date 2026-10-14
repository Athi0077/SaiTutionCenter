const User = require('../models/User');
const Counter = require('../models/Counter');
const Enrollment = require('../models/Enrollment');
const TeacherAssignment = require('../models/TeacherAssignment');
const Class = require('../models/Class');
const AcademicYear = require('../models/AcademicYear');


exports.getStudents = async (req, res) => {
  try {
    let students = [];
    if (req.user.role === 'principal' || req.user.role === 'teacher' || req.user.role === 'superadmin') {
      const query = { role: 'student' };
      if (req.user.schoolId) query.schoolId = req.user.schoolId;
      students = await User.find(query).sort({ createdAt: -1 }).lean();

      const TuitionFee = require('../models/TuitionFee');
      const Standard = require('../models/Standard');

      const [allClasses, allStandards, allFees] = await Promise.all([
        Class.find({}).lean(),
        Standard.find({}).lean(),
        TuitionFee.find({}).lean()
      ]);

      const standardMap = new Map();
      allStandards.forEach(std => standardMap.set(std._id.toString(), std));

      const feeMap = new Map();
      allFees.forEach(fee => {
        if (fee.studentId) {
          feeMap.set(fee.studentId.toString(), fee);
        }
      });

      students = students.map(student => {
        const studentIdStr = student._id.toString();
        const fee = feeMap.get(studentIdStr);

        // 1. Find class by Class.students
        let studentClass = allClasses.find(c => 
          c.students && c.students.some(s => (s && s._id ? s._id : s).toString() === studentIdStr)
        );

        // 2. Fallback: check fee.classId or fee.batchId
        if (!studentClass && fee) {
          const classIdToFind = (fee.classId || fee.batchId)?.toString();
          if (classIdToFind) {
            studentClass = allClasses.find(c => c._id.toString() === classIdToFind);
          }
        }

        // 3. Fallback: check standard
        let studentStandard = null;
        if (studentClass && studentClass.standardId) {
          studentStandard = standardMap.get(studentClass.standardId.toString());
        }
        if (!studentStandard && fee && fee.standardId) {
          studentStandard = standardMap.get(fee.standardId.toString());
        }
        if (!studentStandard && studentClass) {
          studentStandard = allStandards.find(s => s.name === studentClass.standard || s.name === studentClass.className);
        }

        const className = studentClass?.className || studentStandard?.name || 'Unassigned';
        const standardId = studentStandard?._id || studentClass?.standardId || null;

        return {
          ...student,
          className,
          standardId,
          standardName: studentStandard?.name || className,
          feeAmount: (fee && fee.totalAmount !== undefined) ? fee.totalAmount : '',
          feePeriod: fee ? (fee.feePeriod || 'Monthly') : 'Monthly',
          feeStatus: fee ? (fee.status || 'PENDING') : 'PENDING',
          feeId: fee ? fee._id : null
        };
      });
    }

    res.status(200).json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.registerTuitionStudent = async (req, res) => {
  try {
    const { studentId, name, password, gender, batchId, standardId, feeAmount, feeDetails, feePeriod } = req.body;
    
    if (req.user.role !== 'teacher' && req.user.role !== 'principal') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const TuitionFee = require('../models/TuitionFee');
    const Standard = require('../models/Standard');

    const existing = await User.findOne({ studentId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with that Student ID already exists.' });
    }

    // Resolve standard if standardId is provided
    let standard = null;
    if (standardId) {
      standard = await Standard.findById(standardId);
    }

    // Optionally resolve batch/section if batchId is provided
    let section = null;
    if (batchId) {
      const Section = require('../models/Section');
      section = await Section.findById(batchId);
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

    // Find class to enroll student — prefer standardId lookup, fallback to section
    let classDoc = null;
    if (standard) {
      classDoc = await Class.findOne({ 
        $or: [
          { standardId: standard._id },
          { standard: standard.name }
        ]
      });
      if (!classDoc) {
        classDoc = await Class.create({
          standard: standard.name,
          standardId: standard._id,
          className: standard.name,
          status: 'active',
          students: [newUser._id],
          schoolId: req.user.schoolId,
          teacherId: req.user._id
        });
      }
    } else if (section) {
      classDoc = await Class.findOne({ section: section.name });
    }

    if (classDoc) {
      await Class.findByIdAndUpdate(classDoc._id, { $addToSet: { students: newUser._id } });
      
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
    const feeData = {
      studentId: newUser._id,
      standardId: standard ? standard._id : (classDoc ? classDoc.standardId : null),
      classId: classDoc ? classDoc._id : null,
      batchId: classDoc ? classDoc._id : (section ? section._id : null),
      totalAmount: Number(feeAmount),
      paidAmount: 0,
      feePeriod: period,
      feeDetails: feeDetails || (period === 'Yearly' ? 'Yearly Tuition Fee' : 'Monthly Tuition Fee'),
      status: 'PENDING',
      lastBilledMonth: currentMonthKey,
      lastBilledYear: currentYear,
      lastResetDate: now
    };
    await TuitionFee.create(feeData);

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

exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, name, password, gender, standardId, feeAmount, feePeriod, feeDetails } = req.body;

    if (req.user.role !== 'teacher' && req.user.role !== 'principal' && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const student = await User.findById(id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Check studentId uniqueness if changed
    if (studentId && studentId.trim() !== student.studentId) {
      const existing = await User.findOne({ studentId: studentId.trim(), _id: { $ne: student._id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'An account with that Student ID already exists.' });
      }
      student.studentId = studentId.trim();
      student.email = `${studentId.trim().toLowerCase()}@studymate.tuition`;
    }

    if (name && name.trim()) {
      student.name = name.trim();
    }

    if (gender) {
      student.gender = gender;
    }

    if (password && password.trim()) {
      student.password = password.trim();
      student.mustChangePassword = false;
    }

    await student.save();

    // Standard & Class updating
    const Standard = require('../models/Standard');
    const TuitionFee = require('../models/TuitionFee');
    const FeeStatus = require('../models/FeeStatus');

    let standard = null;
    let classDoc = null;

    if (standardId) {
      standard = await Standard.findById(standardId);
      if (standard) {
        // Remove student from any other class
        await Class.updateMany({ students: student._id }, { $pull: { students: student._id } });

        // Find or create class for this standard
        classDoc = await Class.findOne({
          $or: [
            { standardId: standard._id },
            { standard: standard.name },
            { className: standard.name }
          ]
        });

        if (!classDoc) {
          classDoc = await Class.create({
            standard: standard.name,
            standardId: standard._id,
            className: standard.name,
            status: 'active',
            students: [student._id],
            schoolId: req.user.schoolId || student.schoolId,
            teacherId: req.user._id
          });
        } else {
          await Class.findByIdAndUpdate(classDoc._id, { $addToSet: { students: student._id } });
        }

        // Update active academic year enrollment
        const activeYear = await AcademicYear.findOne({ status: 'active' });
        if (activeYear && classDoc) {
          await Enrollment.findOneAndUpdate(
            { studentId: student._id },
            {
              $set: {
                academicYearId: activeYear._id,
                classId: classDoc._id,
                schoolId: req.user.schoolId || student.schoolId,
                type: 'tuition_enrollment',
                status: 'active'
              }
            },
            { upsert: true, new: true }
          );
        }
      }
    }

    // TuitionFee updating or creating
    if (feeAmount !== undefined && feeAmount !== null && feeAmount !== '') {
      const period = (feePeriod === 'Yearly' || feePeriod === 'Year') ? 'Yearly' : 'Monthly';
      const details = feeDetails || (period === 'Yearly' ? 'Yearly Tuition Fee' : 'Monthly Tuition Fee');
      
      let fee = await TuitionFee.findOne({ studentId: student._id });
      if (fee) {
        fee.totalAmount = Number(feeAmount);
        fee.feePeriod = period;
        fee.feeDetails = details;
        if (standard) fee.standardId = standard._id;
        if (classDoc) {
          fee.classId = classDoc._id;
          fee.batchId = classDoc._id;
        }
        await fee.save();
      } else {
        const now = new Date();
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const currentYear = now.getFullYear();

        fee = await TuitionFee.create({
          studentId: student._id,
          standardId: standard ? standard._id : (classDoc ? classDoc.standardId : null),
          classId: classDoc ? classDoc._id : null,
          batchId: classDoc ? classDoc._id : null,
          totalAmount: Number(feeAmount),
          paidAmount: 0,
          feePeriod: period,
          feeDetails: details,
          status: 'PENDING',
          lastBilledMonth: currentMonthKey,
          lastBilledYear: currentYear,
          lastResetDate: now
        });
      }

      if (classDoc) {
        await FeeStatus.findOneAndUpdate(
          { studentId: student._id },
          {
            $set: {
              classId: classDoc._id,
              feePeriod: period,
              statusUpdatedAt: new Date()
            }
          },
          { upsert: true, new: true }
        );
      }
    }

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: {
        _id: student._id,
        studentId: student.studentId,
        name: student.name,
        gender: student.gender,
        className: classDoc?.className || standard?.name || 'Unassigned',
        standardId: standard?._id || classDoc?.standardId || null,
        feeAmount: feeAmount ? Number(feeAmount) : 0,
        feePeriod: feePeriod || 'Monthly'
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'teacher' && req.user.role !== 'principal' && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const student = await User.findById(id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // 1. Remove from all classes
    await Class.updateMany({ students: student._id }, { $pull: { students: student._id } });
    await Class.updateMany({ classLeader: student._id }, { $unset: { classLeader: 1 } });

    // 2. Remove Tuition Fees & FeeStatus
    const TuitionFee = require('../models/TuitionFee');
    const FeeStatus = require('../models/FeeStatus');
    await TuitionFee.deleteMany({ studentId: student._id });
    await FeeStatus.deleteMany({ studentId: student._id });

    // 3. Remove Enrollments
    await Enrollment.deleteMany({ studentId: student._id });

    // 4. Clean up any attendance, homework, test marks
    try {
      const TuitionAttendance = require('../models/TuitionAttendance');
      await TuitionAttendance.deleteMany({ studentId: student._id });
    } catch (e) {}

    try {
      const TuitionHomeworkSubmission = require('../models/TuitionHomeworkSubmission');
      await TuitionHomeworkSubmission.deleteMany({ studentId: student._id });
    } catch (e) {}

    try {
      const TuitionTestMark = require('../models/TuitionTestMark');
      await TuitionTestMark.deleteMany({ studentId: student._id });
    } catch (e) {}

    // 5. Delete the User document
    await User.findByIdAndDelete(student._id);

    return res.status(200).json({
      success: true,
      message: `Student ${student.name} deleted successfully`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
