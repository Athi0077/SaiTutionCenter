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

    res.json(batches);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
