const mongoose = require('mongoose');
const Class = require('./src/models/Class');
const Enrollment = require('./src/models/Enrollment');

mongoose.connect('mongodb://127.0.0.1:27017/school_management').then(async () => {
  const teacherClass = await Class.findOne({ className: '5th Standard - A' });
  await Enrollment.updateMany({ classId: '6ab6b53466f195ee42b72f8e' }, { $set: { classId: teacherClass._id } });
  console.log('Updated enrollments');
  process.exit(0);
});
