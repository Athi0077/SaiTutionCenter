const Resource = require('../models/Resource');
const Class = require('../models/Class');

exports.getStudentResources = async (req, res) => {
  try {
    const studentClass = await Class.findOne({ students: req.user._id });
    if (!studentClass) return res.json({ success: true, data: [] });
    
    const resources = await Resource.find({ classId: studentClass._id })
      .populate('subjectId', 'name')
      .populate('teacherId', 'name')
      .sort({ createdAt: -1 });
      
    res.json({ success: true, data: resources });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
