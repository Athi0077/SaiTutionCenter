const request = require('supertest');
const app = require('../server');
const User = require('../src/models/User');
const Class = require('../src/models/Class');
const BirthdayWish = require('../src/models/BirthdayWish');
const jwt = require('jsonwebtoken');
const {
  getSchoolLocalTodayStr,
  getSchoolNextMidnightDate,
  isBirthdayToday,
  calculateAge,
} = require('../src/utils/birthdayUtils');
const { cleanupExpiredWishes } = require('../src/services/birthdayScheduler');

const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, sessionVersion: user.sessionVersion || 1 },
    process.env.JWT_SECRET || 'test_secret',
    { expiresIn: '1h' }
  );
};

let principal, teacher, student1, student2, studentNoDob, principalToken, teacherToken, student1Token, student2Token;
let todayStr;

beforeEach(async () => {
  todayStr = getSchoolLocalTodayStr();
  const [yearStr, monthStr, dayStr] = todayStr.split('-');
  const currentYear = parseInt(yearStr, 10);
  
  // Construct birthdate that falls on today's month & day
  const todayDob = new Date(Date.UTC(2010, parseInt(monthStr, 10) - 1, parseInt(dayStr, 10)));

  // 1. Principal with today's birthday
  principal = await User.create({
    name: 'Principal Smith',
    email: 'principal@test.com',
    password: 'Password123!',
    role: 'principal',
    dateOfBirth: todayDob,
    status: 'active'
  });
  principalToken = generateToken(principal);

  // 2. Teacher with today's birthday
  teacher = await User.create({
    name: 'Teacher Johnson',
    email: 'teacher@test.com',
    password: 'Password123!',
    role: 'teacher',
    designation: 'Senior Science Teacher',
    dateOfBirth: todayDob,
    status: 'active'
  });
  teacherToken = generateToken(teacher);

  // 3. Student 1 with today's birthday
  student1 = await User.create({
    name: 'Student Alice',
    email: 'alice@test.com',
    studentId: 'STU101',
    password: 'Password123!',
    role: 'student',
    dateOfBirth: todayDob,
    bloodGroup: 'O+',
    phone: '9876543210',
    address: '123 Main St',
    status: 'active'
  });
  student1Token = generateToken(student1);

  // 4. Student 2 with today's birthday
  student2 = await User.create({
    name: 'Student Bob',
    email: 'bob@test.com',
    studentId: 'STU102',
    password: 'Password123!',
    role: 'student',
    dateOfBirth: todayDob,
    bloodGroup: 'AB+',
    status: 'active'
  });
  student2Token = generateToken(student2);

  // 5. Student with missing DOB
  studentNoDob = await User.create({
    name: 'Student Charlie',
    email: 'charlie@test.com',
    studentId: 'STU103',
    password: 'Password123!',
    role: 'student',
    status: 'active'
  });

  // Assign student1 and student2 to a class
  await Class.create({
    standard: '10',
    section: 'A',
    className: '10-A',
    teacherId: teacher._id,
    students: [student1._id, student2._id],
    status: 'active'
  });
});

describe('StudyMate — Birthday Celebration System & Student Profile Enhancements', () => {

  /* ================= PROFILE UPDATES ================= */
  describe('Phase 1 & 2 — Profile Updates & Permissions', () => {

    it('1. Student can update Date of Birth and Blood Group', async () => {
      const pastDob = '2011-05-15';
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          dateOfBirth: pastDob,
          bloodGroup: 'B+'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.bloodGroup).toBe('B+');
      expect(new Date(res.body.user.dateOfBirth).toISOString().startsWith('2011-05-15')).toBe(true);
    });

    it('2. Invalid or future Date of Birth is rejected', async () => {
      const futureDate = '2099-01-01';
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ dateOfBirth: futureDate });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toMatch(/cannot be in the future/i);
    });

    it('3. Invalid blood group selection is rejected', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ bloodGroup: 'InvalidGroup' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toMatch(/Invalid Blood Group/i);
    });

    it('4. Protected profile fields (role, studentId) cannot be modified', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ role: 'principal', studentId: 'HACKED999' });

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toMatch(/cannot be modified/i);
    });
  });

  /* ================= BIRTHDAY CARDS & DETECTION ================= */
  describe('Phase 3 — Birthday Cards & Detection', () => {

    it('5. Today birthday cards return Student, Teacher, and Principal with today birthday', async () => {
      const res = await request(app)
        .get('/api/birthdays/today')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);

      const names = res.body.data.map(u => u.name);
      expect(names).toContain('Principal Smith');
      expect(names).toContain('Teacher Johnson');
      expect(names).toContain('Student Alice');
      expect(names).toContain('Student Bob');
    });

    it('6. Users with missing Date of Birth are excluded', async () => {
      const res = await request(app)
        .get('/api/birthdays/today')
        .set('Authorization', `Bearer ${student1Token}`);

      const names = res.body.data.map(u => u.name);
      expect(names).not.toContain('Student Charlie');
    });

    it('7. Student cards contain Standard and Section', async () => {
      const res = await request(app)
        .get('/api/birthdays/today')
        .set('Authorization', `Bearer ${student1Token}`);

      const aliceCard = res.body.data.find(u => u.name === 'Student Alice');
      expect(aliceCard).toBeDefined();
      expect(aliceCard.classInfo).toBeDefined();
      expect(aliceCard.classInfo.standard).toBe('10');
      expect(aliceCard.classInfo.section).toBe('A');
    });

    it('8. Age calculation is accurate', async () => {
      const res = await request(app)
        .get('/api/birthdays/today')
        .set('Authorization', `Bearer ${student1Token}`);

      const aliceCard = res.body.data.find(u => u.name === 'Student Alice');
      const expectedAge = calculateAge(aliceCard.dateOfBirth, todayStr);
      expect(aliceCard.age).toBe(expectedAge);
    });

    it('9. Private fields (blood group, address, phone, password) are NOT exposed in birthday cards', async () => {
      const res = await request(app)
        .get('/api/birthdays/today')
        .set('Authorization', `Bearer ${student1Token}`);

      const aliceCard = res.body.data.find(u => u.name === 'Student Alice');
      expect(aliceCard.bloodGroup).toBeUndefined();
      expect(aliceCard.address).toBeUndefined();
      expect(aliceCard.phone).toBeUndefined();
      expect(aliceCard.password).toBeUndefined();
      expect(aliceCard.email).toBeUndefined();
    });

    it('10. Feb 29 leap year observance logic works correctly', () => {
      const leapDob = new Date('2004-02-29T00:00:00.000Z');
      
      // In non-leap year (e.g. 2026-02-28), observance is Feb 28
      expect(isBirthdayToday(leapDob, '2026-02-28')).toBe(true);
      expect(isBirthdayToday(leapDob, '2026-03-01')).toBe(false);

      // In leap year (e.g. 2028-02-29), observance is Feb 29
      expect(isBirthdayToday(leapDob, '2028-02-29')).toBe(true);
      expect(isBirthdayToday(leapDob, '2028-02-28')).toBe(false);
    });
  });

  /* ================= BIRTHDAY WISHES ================= */
  describe('Phase 4 — Birthday Wishes & Role Permissions', () => {

    it('11. Principal can post a birthday wish', async () => {
      const res = await request(app)
        .post(`/api/birthdays/${student1._id}/wishes`)
        .set('Authorization', `Bearer ${principalToken}`)
        .send({ message: 'Happy Birthday Alice! Have a brilliant year.' });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.senderRole).toBe('principal');
      expect(res.body.data.message).toBe('Happy Birthday Alice! Have a brilliant year.');
    });

    it('12. Teacher can post a birthday wish', async () => {
      const res = await request(app)
        .post(`/api/birthdays/${student1._id}/wishes`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ message: 'Best wishes from your science teacher!' });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.senderRole).toBe('teacher');
    });

    it('13. Student CANNOT post a birthday wish (Forbidden 403)', async () => {
      const res = await request(app)
        .post(`/api/birthdays/${student2._id}/wishes`)
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ message: 'Happy Birthday friend!' });

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toMatch(/Only Principal and Teacher/i);
    });

    it('14. All roles (Student, Teacher, Principal) can view published wishes', async () => {
      // Post wish as teacher
      await request(app)
        .post(`/api/birthdays/${student1._id}/wishes`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ message: 'Enjoy your special day!' });

      // Fetch as student
      const res = await request(app)
        .get('/api/birthdays/today/wishes')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].message).toBe('Enjoy your special day!');
    });

    it('15. Cannot post wish to a user who does NOT have a birthday today', async () => {
      const res = await request(app)
        .post(`/api/birthdays/${studentNoDob._id}/wishes`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ message: 'Happy early birthday!' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toMatch(/not celebrating a birthday today/i);
    });

    it('16. Empty or excessively long (> 500 chars) wish messages are rejected', async () => {
      const longMessage = 'A'.repeat(501);
      const res = await request(app)
        .post(`/api/birthdays/${student1._id}/wishes`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ message: longMessage });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toMatch(/cannot exceed 500 characters/i);
    });
  });

  /* ================= LIFECYCLE & CLEANUP ================= */
  describe('Phase 5 — Daily Lifecycle & Automatic Cleanup', () => {

    it('17. Expired wishes from previous days are not returned by today wishes API', async () => {
      // Manually insert an expired wish from yesterday
      const yesterdayStr = '2020-01-01';
      await BirthdayWish.create({
        targetUserId: student1._id,
        senderId: teacher._id,
        senderName: teacher.name,
        senderRole: teacher.role,
        message: 'Old wish from past year',
        celebrationDate: yesterdayStr,
        expiresAt: new Date('2020-01-02T00:00:00Z')
      });

      const res = await request(app)
        .get('/api/birthdays/today/wishes')
        .set('Authorization', `Bearer ${student1Token}`);

      expect(res.statusCode).toEqual(200);
      const messages = res.body.data.map(w => w.message);
      expect(messages).not.toContain('Old wish from past year');
    });

    it('18. cleanupExpiredWishes removes expired wishes idempotently without deleting user profiles', async () => {
      // Insert expired wish
      await BirthdayWish.create({
        targetUserId: student1._id,
        senderId: teacher._id,
        senderName: teacher.name,
        senderRole: teacher.role,
        message: 'Expired wish to clean',
        celebrationDate: '2020-01-01',
        expiresAt: new Date('2020-01-02T00:00:00Z')
      });

      // Run cleanup
      const deletedCount = await cleanupExpiredWishes();
      expect(deletedCount).toBeGreaterThanOrEqual(1);

      // Verify user profiles were NOT deleted
      const userCount = await User.countDocuments();
      expect(userCount).toBeGreaterThanOrEqual(5);

      // Running cleanup again is safe (idempotent)
      const secondRun = await cleanupExpiredWishes();
      expect(secondRun).toBe(0);
    });
  });
});
