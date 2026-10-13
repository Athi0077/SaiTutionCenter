const request = require('supertest');
const app = require('../server');
const User = require('../src/models/User');
const Class = require('../src/models/Class');
const FeeStatus = require('../src/models/FeeStatus');
const jwt = require('jsonwebtoken');

// Helper to generate a JWT for a user
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, sessionVersion: user.sessionVersion || 1 },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

let teacher, teacher2, student1, student2, student3, parent, classDoc, classDoc2;
let teacherToken, teacher2Token, studentToken, student2Token, parentToken;

beforeEach(async () => {
  // Create teacher
  teacher = await User.create({
    name: 'Teacher One',
    email: 'teacher1@test.com',
    password: 'Password123!',
    role: 'teacher',
  });
  teacherToken = generateToken(teacher);

  // Create a second teacher (unauthorized for classDoc)
  teacher2 = await User.create({
    name: 'Teacher Two',
    email: 'teacher2@test.com',
    password: 'Password123!',
    role: 'teacher',
  });
  teacher2Token = generateToken(teacher2);

  // Create students
  student1 = await User.create({
    name: 'Student One',
    email: 'student1@test.com',
    studentId: 'STU001',
    password: 'Password123!',
    role: 'student',
  });
  studentToken = generateToken(student1);

  student2 = await User.create({
    name: 'Student Two',
    email: 'student2@test.com',
    studentId: 'STU002',
    password: 'Password123!',
    role: 'student',
  });
  student2Token = generateToken(student2);

  student3 = await User.create({
    name: 'Student Three',
    email: 'student3@test.com',
    studentId: 'STU003',
    password: 'Password123!',
    role: 'student',
  });

  // Create parent linked to student1 and student3
  parent = await User.create({
    name: 'Parent One',
    email: 'parent1@test.com',
    password: 'Password123!',
    role: 'parent',
    children: [student1._id, student3._id],
  });
  parentToken = generateToken(parent);

  // Create class with teacher and students
  classDoc = await Class.create({
    standard: '10',
    section: 'A',
    className: '10 - A',
    teacherId: teacher._id,
    students: [student1._id, student2._id],
    status: 'active',
  });

  // Second class owned by teacher2
  classDoc2 = await Class.create({
    standard: '10',
    section: 'B',
    className: '10 - B',
    teacherId: teacher2._id,
    students: [student3._id],
    status: 'active',
  });
});

describe('Fee Status Management', () => {

  // 1. Newly created student defaults to pending
  it('should return default pending status for new student', async () => {
    const res = await request(app)
      .get('/api/fee-status/my-status')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.feeStatus).toBe('pending');
  });

  // 2. Teacher can change Pending to Completed
  it('should allow authorized teacher to mark fee as completed', async () => {
    const res = await request(app)
      .put(`/api/fee-status/student/${student1._id}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ feeStatus: 'completed' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.feeStatus).toBe('completed');
  });

  // 3. Teacher can change Completed back to Pending
  it('should allow authorized teacher to revert fee status to pending', async () => {
    // First set to completed
    await request(app)
      .put(`/api/fee-status/student/${student1._id}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ feeStatus: 'completed' });

    // Then revert to pending
    const res = await request(app)
      .put(`/api/fee-status/student/${student1._id}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ feeStatus: 'pending' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.feeStatus).toBe('pending');
  });

  // 4. Status persists after re-fetch
  it('should persist fee status after fetching again', async () => {
    await request(app)
      .put(`/api/fee-status/student/${student1._id}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ feeStatus: 'completed' });

    const res = await request(app)
      .get('/api/fee-status/my-status')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.feeStatus).toBe('completed');
  });

  // 5. Teacher cannot update student outside their class
  it('should deny teacher updating student from another class', async () => {
    const res = await request(app)
      .put(`/api/fee-status/student/${student3._id}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ feeStatus: 'completed' });

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toMatch(/Access denied/i);
  });

  // 6. Student can only retrieve their own fee status
  it('should allow student to get their own fee status', async () => {
    const res = await request(app)
      .get('/api/fee-status/my-status')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.feeStatus).toBeDefined();
  });

  // 7. Parent can retrieve linked child's fee status
  it('should allow parent to get linked child fee status', async () => {
    const res = await request(app)
      .get(`/api/fee-status/child/${student1._id}`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.feeStatus).toBeDefined();
    expect(res.body.data.childId).toBe(student1._id.toString());
  });

  // 8. Parent cannot retrieve unrelated student's fee status
  it('should deny parent access to unrelated student fee status', async () => {
    const res = await request(app)
      .get(`/api/fee-status/child/${student2._id}`)
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.statusCode).toEqual(403);
    expect(res.body.message).toMatch(/Access denied/i);
  });

  // 9. Parent or student cannot update fee status
  it('should deny student from updating fee status', async () => {
    const res = await request(app)
      .put(`/api/fee-status/student/${student1._id}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ feeStatus: 'completed' });

    expect(res.statusCode).toEqual(403);
  });

  it('should deny parent from updating fee status', async () => {
    const res = await request(app)
      .put(`/api/fee-status/student/${student1._id}`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ feeStatus: 'completed' });

    expect(res.statusCode).toEqual(403);
  });

  // 10 & 11. Student dashboard reflects pending/completed status
  it('should return pending status initially for student dashboard', async () => {
    const res = await request(app)
      .get('/api/fee-status/my-status')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.feeStatus).toBe('pending');
  });

  it('should return completed status after teacher updates it', async () => {
    await request(app)
      .put(`/api/fee-status/student/${student1._id}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ feeStatus: 'completed' });

    const res = await request(app)
      .get('/api/fee-status/my-status')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.feeStatus).toBe('completed');
  });

  // 12. Parent dashboard displays both Pending and Completed correctly
  it('should return all children fee statuses for parent', async () => {
    // Mark student1 as completed
    await request(app)
      .put(`/api/fee-status/student/${student1._id}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ feeStatus: 'completed' });

    // student3 remains pending (in teacher2's class)
    const res = await request(app)
      .get('/api/fee-status/my-children')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.length).toBe(2);
    
    const student1Fee = res.body.data.find(d => d.childId === student1._id.toString());
    const student3Fee = res.body.data.find(d => d.childId === student3._id.toString());
    
    expect(student1Fee.feeStatus).toBe('completed');
    expect(student3Fee.feeStatus).toBe('pending');
  });

  // 13. Multiple children show respective statuses
  it('should show correct fee statuses for each child independently', async () => {
    // Mark student1 as completed
    await request(app)
      .put(`/api/fee-status/student/${student1._id}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ feeStatus: 'completed' });

    // Mark student3 as completed by teacher2
    await request(app)
      .put(`/api/fee-status/student/${student3._id}`)
      .set('Authorization', `Bearer ${teacher2Token}`)
      .send({ feeStatus: 'completed' });

    const res = await request(app)
      .get('/api/fee-status/my-children')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(res.statusCode).toEqual(200);
    const allCompleted = res.body.data.every(d => d.feeStatus === 'completed');
    expect(allCompleted).toBe(true);
  });

  // 14. Class fee statuses endpoint works
  it('should return fee statuses for all students in a class', async () => {
    await request(app)
      .put(`/api/fee-status/student/${student1._id}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ feeStatus: 'completed' });

    const res = await request(app)
      .get(`/api/fee-status/class/${classDoc._id}`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data[student1._id.toString()].feeStatus).toBe('completed');
    expect(res.body.data[student2._id.toString()].feeStatus).toBe('pending');
  });

  // Validate invalid fee status values
  it('should reject invalid fee status values', async () => {
    const res = await request(app)
      .put(`/api/fee-status/student/${student1._id}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ feeStatus: 'invalid_status' });

    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toMatch(/feeStatus must be/i);
  });

  // Teacher cannot access class fee statuses for another teacher's class
  it('should deny teacher access to fee statuses of another class', async () => {
    const res = await request(app)
      .get(`/api/fee-status/class/${classDoc2._id}`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.statusCode).toEqual(403);
  });
});
