const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Class = require('../src/models/Class');
const AcademicYear = require('../src/models/AcademicYear');
const Enrollment = require('../src/models/Enrollment');

async function runMigration() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`Connected to DB: ${mongoose.connection.name}`);

    // Check if an academic year already exists
    let activeYear = await AcademicYear.findOne({ status: 'active' });
    
    if (!activeYear) {
      console.log('No active Academic Year found. Creating one for 2026-2027...');
      activeYear = await AcademicYear.create({
        name: '2026-2027',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2027-04-30'),
        status: 'active'
      });
      console.log(`Created Academic Year: ${activeYear.name} (${activeYear._id})`);
    } else {
      console.log(`Active Academic Year exists: ${activeYear.name} (${activeYear._id})`);
    }

    const classes = await Class.find({});
    console.log(`Found ${classes.length} classes.`);

    let enrollmentsCreated = 0;
    let enrollmentsSkipped = 0;

    for (const cls of classes) {
      for (const studentId of cls.students) {
        const existingEnrollment = await Enrollment.findOne({ studentId, academicYearId: activeYear._id });
        if (existingEnrollment) {
          enrollmentsSkipped++;
        } else {
          await Enrollment.create({
            studentId,
            academicYearId: activeYear._id,
            classId: cls._id,
            status: 'active',
            type: 're_enrolled'
          });
          enrollmentsCreated++;
        }
      }
    }

    console.log(`Migration Complete.`);
    console.log(`Enrollments Created: ${enrollmentsCreated}`);
    console.log(`Enrollments Skipped (Already existed): ${enrollmentsSkipped}`);

    process.exit(0);
  } catch (error) {
    console.error('Migration Error:', error);
    process.exit(1);
  }
}

runMigration();
