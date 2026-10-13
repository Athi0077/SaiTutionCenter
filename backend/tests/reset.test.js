const request = require('supertest');
const app = require('../server');
const User = require('../src/models/User');
const Class = require('../src/models/Class');

let teacher1, teacher2, student, otherStudent;
let t1Token, t2Token, studentToken;

beforeEach(async () => {
  // Create Teacher 1 and 2
  teacher1 = await User.create({ name: 'Teacher 1', email: 't1@test.com', password: 'password', role: 'teacher' });
  teacher2 = await User.create({ name: 'Teacher 2', email: 't2@test.com', password: 'password', role: 'teacher' });

  // Create Students
  student = await User.create({ name: 'Student 1', email: 's1@test.com', studentId: 'S1', password: 'password', role: 'student' });
  otherStudent = await User.create({ name: 'Student 2', email: 's2@test.com', studentId: 'S2', password: 'password', role: 'student' });

  // Create Class assigned to Teacher 1 containing Student 1
  await Class.create({
    standard: '10',
    section: 'A',
    className: '10 A',
    teacherId: teacher1._id,
    students: [student._id]
  });

  // Create Class assigned to Teacher 2 containing Student 2
  await Class.create({
    standard: '10',
    section: 'B',
    className: '10 B',
    teacherId: teacher2._id,
    students: [otherStudent._id]
  });

  // Get tokens
  t1Token = (await request(app).post('/api/auth/login').send({ email: 't1@test.com', password: 'password' })).body.token;
  t2Token = (await request(app).post('/api/auth/login').send({ email: 't2@test.com', password: 'password' })).body.token;
  studentToken = (await request(app).post('/api/auth/login').send({ email: 's1@test.com', password: 'password' })).body.token;
});

describe('Password Reset Authorization Tests', () => {

  it('should allow assigned class teacher to reset student password', async () => {
    const res = await request(app)
      .post(`/api/users/students/${student._id}/reset-password`)
      .set('Authorization', `Bearer ${t1Token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.tempPassword).toBeDefined();

    const updatedStudent = await User.findById(student._id);
    expect(updatedStudent.mustChangePassword).toBe(true);
    expect(updatedStudent.sessionVersion).toBeGreaterThan(student.sessionVersion || 1);
  });

  it('should deny unassigned teacher from resetting student password', async () => {
    const res = await request(app)
      .post(`/api/users/students/${student._id}/reset-password`)
      .set('Authorization', `Bearer ${t2Token}`);
    
    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toMatch(/not authorized/i);
  });

  it('should deny student from invoking reset endpoint', async () => {
    const res = await request(app)
      .post(`/api/users/students/${otherStudent._id}/reset-password`)
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect(res.statusCode).toEqual(403);
  });
});
