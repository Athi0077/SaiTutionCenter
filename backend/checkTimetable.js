const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Timetable = require("./src/models/Timetable");
const Class = require("./src/models/Class");

mongoose.connect(process.env.MONGO_URI)
.then(async () => {
  const timetables = await Timetable.find().populate('classId');
  console.log(`Found ${timetables.length} timetables.`);
  timetables.forEach(t => {
    console.log(`Class: ${t.classId ? t.classId.className : 'Unknown'}, ClassID: ${t.classId ? t.classId._id : t.classId}, AcademicYear: ${t.academicYearId}`);
  });
  
  const classes = await Class.find();
  console.log(`\nFound ${classes.length} classes in DB.`);
  
  process.exit(0);
})
.catch(err => {
  console.error(err);
  process.exit(1);
});
