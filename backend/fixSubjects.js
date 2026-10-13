const mongoose = require("mongoose");
const TeacherAssignment = require("./src/models/TeacherAssignment");
const Class = require("./src/models/Class");
const Subject = require("./src/models/Subject");
const Standard = require("./src/models/Standard");
const Section = require("./src/models/Section");

mongoose.connect("mongodb://localhost:27017/school_management").then(async () => {
  const assignments = await TeacherAssignment.find().populate("standardId sectionId");
  
  for (const a of assignments) {
    if (a.subject) {
      let subjectObj = await Subject.findOne({ name: { $regex: new RegExp(`^${a.subject}$`, 'i') } });
      if (!subjectObj) {
        subjectObj = await Subject.create({
          name: a.subject,
          code: a.subject.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 1000)
        });
        console.log(`Created subject ${a.subject}`);
      }

      const className = `${a.standardId.name} - ${a.sectionId.name}`;
      const existingClass = await Class.findOne({ className, teacherId: a.teacherId });
      
      if (existingClass) {
        if (!existingClass.subjects.includes(subjectObj._id)) {
          existingClass.subjects.push(subjectObj._id);
          await existingClass.save();
          console.log(`Added subject ${a.subject} to class ${className}`);
        }
      }
    }
  }

  console.log("Migration complete");
  process.exit(0);
});
