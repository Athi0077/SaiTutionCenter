const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../src/models/User');
const Attendance = require('../src/models/Attendance');
const Homework = require('../src/models/Homework');
const HomeworkSubmission = require('../src/models/HomeworkSubmission');
const Project = require('../src/models/Project');
const ProjectSubmission = require('../src/models/ProjectSubmission');
const Test = require('../src/models/Test');
const TestSubmission = require('../src/models/TestSubmission');
const LeaveRequest = require('../src/models/LeaveRequest');
const ClassJoinRequest = require('../src/models/ClassJoinRequest');
const Notification = require('../src/models/Notification');
const TeacherAssignment = require('../src/models/TeacherAssignment');
const Class = require('../src/models/Class');

async function cleanup() {
  const isDryRun = process.argv.includes('--dry-run');
  const isConfirm = process.argv.includes('--confirm');

  if (!isDryRun && !isConfirm) {
    console.error('Error: You must specify either --dry-run or --confirm');
    console.error('Example: npm run cleanup:test -- --dry-run');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`Connected to DB: ${mongoose.connection.name}`);

    // Prevent running against production
    if (mongoose.connection.name === 'school_management_prod') {
      console.error('CRITICAL ERROR: Connected to production database. Aborting cleanup.');
      process.exit(1);
    }

    console.log('--- STARTING SAFE TEST DATA CLEANUP ---\n');
    console.log(isDryRun ? 'MODE: DRY RUN (No data will be deleted)\n' : 'MODE: PERMANENT DELETION\n');

    // 1. Identify Test Users
    const testStudents = await User.find({ email: /@test\.com$/, role: 'student' });
    const testTeachers = await User.find({ email: /@test\.com$/, role: 'teacher' });

    const testStudentIds = testStudents.map(u => u._id);
    const testTeacherIds = testTeachers.map(u => u._id);
    const allTestUserIds = [...testStudentIds, ...testTeacherIds];

    console.log(`Found ${testStudents.length} Test Students`);
    console.log(`Found ${testTeachers.length} Test Teachers`);

    if (allTestUserIds.length === 0) {
      console.log('No test users found. Exiting.');
      process.exit(0);
    }

    // 2. Identify Related Records
    
    // Teacher Assignments
    const testAssignments = await TeacherAssignment.find({ teacherId: { $in: testTeacherIds } });
    
    // Attendance
    const testAttendance = await Attendance.find({ 
      $or: [
        { teacherId: { $in: testTeacherIds } },
        { studentId: { $in: testStudentIds } },
        { 'records.studentId': { $in: testStudentIds } }
      ]
    });

    // Leave Requests
    const testLeaveRequests = await LeaveRequest.find({ studentId: { $in: testStudentIds } });

    // Class Join Requests
    const testJoinRequests = await ClassJoinRequest.find({ studentId: { $in: testStudentIds } });

    // Homework & Submissions
    const testHomework = await Homework.find({ teacherId: { $in: testTeacherIds } });
    const testHomeworkIds = testHomework.map(h => h._id);
    const testHwSubmissions = await HomeworkSubmission.find({ 
      $or: [
        { studentId: { $in: testStudentIds } },
        { homeworkId: { $in: testHomeworkIds } }
      ]
    });

    // Projects & Submissions
    const testProjects = await Project.find({ teacherId: { $in: testTeacherIds } });
    const testProjectIds = testProjects.map(p => p._id);
    const testProjectSubmissions = await ProjectSubmission.find({
      $or: [
        { studentId: { $in: testStudentIds } },
        { projectId: { $in: testProjectIds } }
      ]
    });

    // Tests & Submissions
    const testTests = await Test.find({ teacherId: { $in: testTeacherIds } });
    const testTestIds = testTests.map(t => t._id);
    const testTestSubmissions = await TestSubmission.find({
      $or: [
        { studentId: { $in: testStudentIds } },
        { testId: { $in: testTestIds } }
      ]
    });

    // Notifications
    const testNotifications = await Notification.find({
      $or: [
        { recipientId: { $in: allTestUserIds } },
        { senderId: { $in: allTestUserIds } }
      ]
    });

    // Classes to update (Remove test teachers & students)
    const classesToUpdate = await Class.find({
      $or: [
        { teacherId: { $in: testTeacherIds } },
        { students: { $in: testStudentIds } }
      ]
    });

    console.log('\n--- DRY RUN SUMMARY (Records to be affected) ---');
    console.log(`Users (Students): ${testStudents.length}`);
    console.log(`Users (Teachers): ${testTeachers.length}`);
    console.log(`TeacherAssignments: ${testAssignments.length}`);
    console.log(`Attendance Records: ${testAttendance.length}`);
    console.log(`Leave Requests: ${testLeaveRequests.length}`);
    console.log(`Class Join Requests: ${testJoinRequests.length}`);
    console.log(`Homework: ${testHomework.length}`);
    console.log(`Homework Submissions: ${testHwSubmissions.length}`);
    console.log(`Projects: ${testProjects.length}`);
    console.log(`Project Submissions: ${testProjectSubmissions.length}`);
    console.log(`Tests: ${testTests.length}`);
    console.log(`Test Submissions: ${testTestSubmissions.length}`);
    console.log(`Notifications: ${testNotifications.length}`);
    console.log(`Classes to update (removing test users): ${classesToUpdate.length}`);
    
    if (isDryRun) {
      console.log('\nRun with --confirm to execute permanent deletion.');
      process.exit(0);
    }

    console.log('\nExecuting Deletion...');

    // Using transaction if replica set, else standard deletes
    // We will use standard deletes here for safety across different mongo setups (e.g. standalone)
    // but we will do it sequentially to ensure integrity.

    await TeacherAssignment.deleteMany({ _id: { $in: testAssignments.map(a => a._id) } });
    await Attendance.deleteMany({ _id: { $in: testAttendance.map(a => a._id) } });
    await LeaveRequest.deleteMany({ _id: { $in: testLeaveRequests.map(a => a._id) } });
    await ClassJoinRequest.deleteMany({ _id: { $in: testJoinRequests.map(a => a._id) } });
    
    await HomeworkSubmission.deleteMany({ _id: { $in: testHwSubmissions.map(a => a._id) } });
    await Homework.deleteMany({ _id: { $in: testHomework.map(a => a._id) } });
    
    await ProjectSubmission.deleteMany({ _id: { $in: testProjectSubmissions.map(a => a._id) } });
    await Project.deleteMany({ _id: { $in: testProjects.map(a => a._id) } });
    
    await TestSubmission.deleteMany({ _id: { $in: testTestSubmissions.map(a => a._id) } });
    await Test.deleteMany({ _id: { $in: testTests.map(a => a._id) } });
    
    await Notification.deleteMany({ _id: { $in: testNotifications.map(a => a._id) } });

    // Clean up Classes
    for (const cls of classesToUpdate) {
      if (testTeacherIds.some(id => id.equals(cls.teacherId))) {
        cls.teacherId = undefined;
      }
      cls.students = cls.students.filter(studentId => !testStudentIds.some(id => id.equals(studentId)));
      await cls.save();
    }

    // Finally delete users
    await User.deleteMany({ _id: { $in: allTestUserIds } });

    console.log('\n--- VERIFICATION ---');
    const remainingStudents = await User.countDocuments({ email: /@test\.com$/, role: 'student' });
    const remainingTeachers = await User.countDocuments({ email: /@test\.com$/, role: 'teacher' });
    const principalExists = await User.findOne({ role: 'principal' });

    console.log(`Test Students Remaining: ${remainingStudents}`);
    console.log(`Test Teachers Remaining: ${remainingTeachers}`);
    console.log(`Principal Account Preserved: ${principalExists ? 'Yes' : 'No'}`);

    console.log('\nCleanup completed safely.');
    process.exit(0);

  } catch (error) {
    console.error('Cleanup Error:', error);
    process.exit(1);
  }
}

cleanup();
