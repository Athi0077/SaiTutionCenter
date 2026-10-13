require("dotenv").config({ path: __dirname + "/.env.loadtest" });
const fs = require("fs");
const path = require("path");

const User = require("../backend/src/models/User");
const Class = require("../backend/src/models/Class");
const Subject = require("../backend/src/models/Subject");
const Homework = require("../backend/src/models/Homework");
const generateToken = require("../backend/src/utils/generateToken");

// Get the exact mongoose instance used by the backend models
const mongoose = User.base;

const TEST_DB_URI = process.env.MONGO_URI;

async function setup() {
  try {
    console.log(`Connecting to ${TEST_DB_URI}`);
    // Connect the backend's mongoose instance to the test DB
    await mongoose.connect(TEST_DB_URI);
    console.log("Connected to Test DB.");

    console.log("Dropping existing database to ensure clean state...");
    await mongoose.connection.db.dropDatabase();

    const usersData = {
      principal: null,
      teachers: [],
      students: [],
      classes: [],
      homework: []
    };

    // 1. Create Principal
    const principal = await User.create({
      name: "LoadTest Principal",
      email: "loadtest_principal_001@test.com",
      password: "password123",
      role: "principal",
      status: "active"
    });
    usersData.principal = {
      id: principal._id,
      token: generateToken(principal._id, principal.role)
    };
    console.log("Principal created.");

    // 2. Create Subjects
    const subjects = [];
    for (let i = 1; i <= 5; i++) {
      const subject = await Subject.create({
        name: `Subject ${i}`,
        code: `SUB${i}`
      });
      subjects.push(subject);
    }

    // 3. Create Teachers
    const teachers = [];
    for (let i = 1; i <= 100; i++) {
      const teacher = await User.create({
        name: `LoadTest Teacher ${i}`,
        email: `loadtest_teacher_${String(i).padStart(3, '0')}@test.com`,
        password: "password123",
        role: "teacher",
        status: "active"
      });
      teachers.push(teacher);
      usersData.teachers.push({
        id: teacher._id,
        token: generateToken(teacher._id, teacher.role)
      });
    }
    console.log("100 Teachers created.");

    // 4. Create Classes (20 classes, 50 students each = 1000 students)
    const classes = [];
    let studentCounter = 1;

    for (let i = 1; i <= 20; i++) {
      const classTeacher = teachers[i - 1]; // First 20 teachers get to be class teachers
      
      const newClass = await Class.create({
        standard: `Std ${Math.ceil(i/2)}`,
        section: i % 2 === 0 ? 'A' : 'B',
        className: `Class ${i}`,
        teacherId: classTeacher._id,
        subjects: subjects.map(s => s._id),
        status: "active",
        students: []
      });

      const classStudents = [];
      for (let j = 1; j <= 50; j++) {
        const student = await User.create({
          name: `LoadTest Student ${studentCounter}`,
          email: `loadtest_student_${String(studentCounter).padStart(3, '0')}@test.com`,
          studentId: `STU_LOAD_${studentCounter}`,
          password: "password123",
          role: "student",
          status: "active"
        });
        classStudents.push(student);
        usersData.students.push({
          id: student._id,
          classId: newClass._id,
          token: generateToken(student._id, student.role)
        });
        studentCounter++;
      }
      
      // Assign students to class
      newClass.students = classStudents.map(s => s._id);
      await newClass.save();

      classes.push(newClass);
      usersData.classes.push({ id: newClass._id, teacherId: newClass.teacherId });

      // Create some homework for this class
      const homework = await Homework.create({
        title: `LoadTest Homework ${i}`,
        description: "Test description",
        classId: newClass._id,
        subjectId: subjects[0]._id,
        teacherId: classTeacher._id,
        dueDate: new Date(Date.now() + 86400000), // tomorrow
        status: "published",
        priority: "normal"
      });
      usersData.homework.push({ id: homework._id, classId: newClass._id, teacherId: classTeacher._id });
    }
    console.log("1000 Students, 20 Classes, 20 Homeworks created.");

    // 5. Write to data/users.json
    const dataDir = path.join(__dirname, "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(path.join(dataDir, "users.json"), JSON.stringify(usersData, null, 2));
    console.log("Saved users.json.");

    console.log("Setup complete!");
    process.exit(0);
  } catch (err) {
    console.error("Setup failed:", err);
    process.exit(1);
  }
}

setup();
