const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('../src/models/User');
const Standard = require('../src/models/Standard');
const Section = require('../src/models/Section');
const Class = require('../src/models/Class');
const TeacherAssignment = require('../src/models/TeacherAssignment');
const Subject = require('../src/models/Subject');

const subjects = ['English', 'Tamil', 'Mathematics', 'Science', 'Social Science'];
const standardsToCreate = ['1st Standard', '2nd Standard', '3rd Standard'];
const sectionsToCreate = ['A', 'B'];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    // Get principal
    const principal = await User.findOne({ role: 'principal' });
    if (!principal) {
      console.error('No Principal found. Please create a principal account first.');
      process.exit(1);
    }

    console.log('Starting seed process...');

    // Get or create standards and sections
    const classesData = [];

    for (const stdName of standardsToCreate) {
      let standard = await Standard.findOne({ name: stdName });
      if (!standard) {
        standard = await Standard.create({ name: stdName, createdBy: principal._id });
      }

      for (const secName of sectionsToCreate) {
        let section = await Section.findOne({ name: secName, standardId: standard._id });
        if (!section) {
          section = await Section.create({ name: secName, standardId: standard._id, createdBy: principal._id });
        }

        const className = `${stdName} - ${secName}`;
        let cls = await Class.findOne({ className });
        if (!cls) {
          cls = await Class.create({
            standard: stdName,
            section: secName,
            className,
            status: 'active',
            subjects: []
          });
        }
        
        classesData.push({ standard, section, cls });
      }
    }

    const testPassword = 'password123';
    let teacherCount = 0;
    let studentCount = 0;

    for (const { standard, section, cls } of classesData) {
      console.log(`Processing ${cls.className}...`);
      
      // 1. Create Teachers
      for (const subjectName of subjects) {
        const teacherEmail = `teacher_${cls.className.replace(/[^a-zA-Z0-9]/g, '')}_${subjectName.toLowerCase().replace(/\\s/g, '')}@test.com`;
        let teacher = await User.findOne({ email: teacherEmail });
        
        if (!teacher) {
          teacher = await User.create({
            name: `${cls.className} ${subjectName} Teacher`,
            email: teacherEmail,
            password: testPassword,
            role: 'teacher',
            status: 'active',
            schoolId: principal.schoolId || null
          });
          teacherCount++;
        }

        // Assign teacher
        let assignment = await TeacherAssignment.findOne({ teacherId: teacher._id, standardId: standard._id, sectionId: section._id, subject: subjectName });
        if (!assignment) {
          await TeacherAssignment.create({
            teacherId: teacher._id,
            standardId: standard._id,
            sectionId: section._id,
            subject: subjectName,
            assignedBy: principal._id
          });
        }

        // Create subject if needed and add to Class
        let subjectObj = await Subject.findOne({ name: { $regex: new RegExp(`^${subjectName}$`, 'i') } });
        if (!subjectObj) {
          subjectObj = await Subject.create({
            name: subjectName,
            code: subjectName.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 1000)
          });
        }
        
        if (!cls.subjects.includes(subjectObj._id)) {
          cls.subjects.push(subjectObj._id);
          cls.teacherId = teacher._id; // just set one as primary class teacher for ease
          await cls.save();
        }
      }

      // 2. Create Students
      for (let i = 1; i <= 10; i++) {
        const studentEmail = `student${i}_${cls.className.replace(/[^a-zA-Z0-9]/g, '')}@test.com`;
        let student = await User.findOne({ email: studentEmail });
        
        if (!student) {
          student = await User.create({
            name: `Student ${i} (${cls.className})`,
            email: studentEmail,
            password: testPassword,
            role: 'student',
            status: 'active',
            schoolId: principal.schoolId || null
          });
          
          if (!cls.students.includes(student._id)) {
            cls.students.push(student._id);
            await cls.save();
          }
          studentCount++;
        }
      }
    }

    console.log(`Seed Complete! Created ${teacherCount} Teachers and ${studentCount} Students.`);
    process.exit(0);
  } catch (error) {
    console.error('Seed Error:', error);
    process.exit(1);
  }
}

seed();
