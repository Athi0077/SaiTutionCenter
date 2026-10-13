const mongoose = require('mongoose');
const Attendance = require('./src/models/Attendance');
const AttendanceSession = require('./src/models/AttendanceSession');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected to DB');
  const sessions = await AttendanceSession.find();
  console.log('Found sessions:', sessions.length);
  
  let ops = [];
  for (const session of sessions) {
    const d = new Date(session.attendanceDate);
    d.setHours(0,0,0,0);
    
    for (const record of session.records) {
      ops.push({
        updateOne: {
          filter: { studentId: record.studentId, classId: session.classId, date: d },
          update: {
            $set: {
              status: record.status,
              markedBy: session.submittedBy,
              markedAt: session.submittedAt
            }
          },
          upsert: true
        }
      });
    }
  }
  
  if (ops.length > 0) {
    const res = await Attendance.bulkWrite(ops);
    console.log('Upserted:', res.upsertedCount, 'Modified:', res.modifiedCount);
  } else {
    console.log('No operations');
  }
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
