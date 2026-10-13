const mongoose = require("mongoose");
const TeacherAssignment = require("./src/models/TeacherAssignment");
const User = require("./src/models/User");

mongoose.connect("mongodb://localhost:27017/school_management").then(async () => {
  const assignments = await TeacherAssignment.find().populate('teacherId');
  console.log("Assignments:", JSON.stringify(assignments, null, 2));
  
  const users = await User.find({ role: 'teacher' });
  console.log("Teachers:", JSON.stringify(users, null, 2));

  process.exit(0);
});
