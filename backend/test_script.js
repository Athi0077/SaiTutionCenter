const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/school_management').then(async () => {
  const User = mongoose.connection.collection('users');
  const vasanth = await User.findOne({ name: 'Vasanth' });
  
  const TeacherAssignment = mongoose.connection.model('TeacherAssignment', require('./src/models/TeacherAssignment').schema);
  const Class = mongoose.connection.model('Class', require('./src/models/Class').schema);
  const Standard = mongoose.connection.model('Standard', require('./src/models/Standard').schema);
  const Section = mongoose.connection.model('Section', require('./src/models/Section').schema);
  
  const assignments = await TeacherAssignment.find({ teacherId: vasanth._id })
      .populate('standardId')
      .populate('sectionId');
      
  const classConditions = assignments.map(a => ({
      standard: a.standardId?.name,
      section: a.sectionId?.name
    })).filter(c => c.standard && c.section);

  let query = { teacherId: vasanth._id };
    if (classConditions.length > 0) {
      query = {
        $or: [
          { teacherId: vasanth._id },
          ...classConditions
        ]
      };
    }
    
  let classes = await Class.find(query);
  console.log('Classes length:', classes.length);
  classes.forEach(c => console.log(c.className, 'teacherId:', c.teacherId));
  process.exit(0);
});
