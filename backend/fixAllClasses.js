const mongoose = require('mongoose');
const Class = require('./src/models/Class');
const Enrollment = require('./src/models/Enrollment');

mongoose.connect('mongodb://127.0.0.1:27017/school_management').then(async () => {
  const classes = await Class.find({});
  const classGroups = {};

  for (let c of classes) {
    if (!classGroups[c.className]) {
      classGroups[c.className] = [];
    }
    classGroups[c.className].push(c);
  }

  for (let className in classGroups) {
    const group = classGroups[className];
    if (group.length > 1) {
      console.log(`Found ${group.length} duplicates for ${className}`);
      
      // Find the primary class (prefer one with a teacherId)
      let primaryClass = group.find(c => c.teacherId) || group[0];
      
      const duplicates = group.filter(c => c._id.toString() !== primaryClass._id.toString());
      
      for (let duplicate of duplicates) {
        // Move students
        if (duplicate.students && duplicate.students.length > 0) {
          primaryClass.students.push(...duplicate.students);
        }
        
        // Update enrollments
        await Enrollment.updateMany(
          { classId: duplicate._id },
          { $set: { classId: primaryClass._id } }
        );
        
        // Delete the duplicate
        await Class.findByIdAndDelete(duplicate._id);
        console.log(`Deleted duplicate class ${duplicate._id}`);
      }
      
      // Save primary
      // Ensure unique students
      primaryClass.students = [...new Set(primaryClass.students.map(id => id.toString()))];
      await primaryClass.save();
      console.log(`Updated primary class ${primaryClass._id} for ${className}`);
    }
  }

  console.log('Finished merging all duplicate classes!');
  process.exit(0);
});
