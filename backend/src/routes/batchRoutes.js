const express = require('express');
const router = express.Router();
const Standard = require('../models/Standard');
const Section = require('../models/Section');
const Class = require('../models/Class');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, async (req, res) => {
  try {
    const standards = await Standard.find().lean();
    const sections = await Section.find().lean();
    const classes = await Class.find()
      .populate('students', 'name email studentId rollNumber role')
      .lean();

    // If sections exist, keep backward compatibility
    if (sections && sections.length > 0) {
      const batches = sections.map(sec => {
        const std = standards.find(s => s._id.toString() === sec.standardId?.toString());
        const cls = classes.find(c => 
          (c.sectionId && c.sectionId.toString() === sec._id.toString()) ||
          (c.section === sec.name && std && c.standard === std.name) ||
          (std && c.className === `${std.name} - ${sec.name}`)
        );
        const validStudents = (cls?.students || []).filter(s => s && s.role === 'student');

        return {
          _id: sec._id,
          name: sec.name,
          standardId: sec.standardId,
          standardName: std ? std.name : '',
          batchName: std ? `${std.name} - ${sec.name}` : sec.name,
          students: validStudents
        };
      });
      return res.json(batches);
    }

    // When sections/batches are removed, return Standards / Classes
    const allStudents = await User.find({ role: 'student' })
      .select('name email studentId rollNumber role profilePic')
      .lean();

    const result = [];
    const assignedStudentIds = new Set();

    for (const std of standards) {
      const cls = classes.find(c => 
        (c.standardId && c.standardId.toString() === std._id.toString()) ||
        c.standard === std.name
      );
      const clsStudents = (cls?.students || []).filter(s => s && s.role === 'student');
      clsStudents.forEach(s => assignedStudentIds.add(s._id.toString()));

      result.push({
        _id: cls ? cls._id : std._id,
        standardId: std._id,
        name: std.name,
        standardName: std.name,
        batchName: `${std.name} Standard`,
        students: clsStudents
      });
    }

    // Include any classes not matched to the standards above
    for (const cls of classes) {
      const alreadyHandled = result.some(r => r._id?.toString() === cls._id?.toString() || r.name === cls.standard);
      if (!alreadyHandled) {
        const clsStudents = (cls?.students || []).filter(s => s && s.role === 'student');
        clsStudents.forEach(s => assignedStudentIds.add(s._id.toString()));
        result.push({
          _id: cls._id,
          standardId: cls.standardId,
          name: cls.className || cls.standard,
          standardName: cls.standard || '',
          batchName: cls.className || cls.standard,
          students: clsStudents
        });
      }
    }

    // Check for any students not assigned to any standard / class
    const unassignedStudents = allStudents.filter(s => !assignedStudentIds.has(s._id.toString()));
    if (unassignedStudents.length > 0) {
      if (result.length > 0) {
        // Add unassigned students to first standard so they appear in dashboard
        result[0].students.push(...unassignedStudents);
      } else {
        result.push({
          _id: 'all_students',
          name: 'All Students',
          standardName: 'General',
          batchName: 'All Students',
          students: unassignedStudents
        });
      }
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
