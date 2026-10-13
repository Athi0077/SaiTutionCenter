const request = require('supertest');
const app = require('../server');
const User = require('../src/models/User');
const SecurityEvent = require('../src/models/SecurityEvent');
const bcrypt = require('bcryptjs');

let student;
let studentPassword = 'Password123!';

beforeEach(async () => {
  // Create a student for testing
  student = await User.create({
    name: 'Test Student',
    email: 'student@test.com',
    studentId: '10A01',
    password: studentPassword,
    role: 'student',
    mustChangePassword: true,
  });
});

describe('Authentication & Rate Limiting Tests', () => {
  
  it('should authenticate with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: student.email, password: studentPassword });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.mustChangePassword).toBe(true);
  });

  it('should reject invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: student.email, password: 'wrongpassword' });
    
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toMatch(/Invalid email or password/i);
  });

  it('should reject nonexistent student', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@test.com', password: 'Password123!' });
    
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toMatch(/Invalid email or password/i);
  });

  it('should enforce first-login mandatory password change', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: student.email, password: studentPassword });
    
    const token = loginRes.body.token;

    // Try to access a protected route (dashboard)
    const res = await request(app)
      .get('/api/dashboard/student')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(403);
    expect(res.body.code).toBe('PASSWORD_CHANGE_REQUIRED');
  });

  it('should allow successful password change and increment sessionVersion', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: student.email, password: studentPassword });
    
    const token = loginRes.body.token;
    const initialSessionVersion = student.sessionVersion || 1;

    // Change password
    const changeRes = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: studentPassword, newPassword: 'NewPassword123!' });
    
    expect(changeRes.statusCode).toEqual(200);
    expect(changeRes.body.success).toBe(true);
    
    const updatedStudent = await User.findById(student._id);
    expect(updatedStudent.mustChangePassword).toBe(false);
    expect(updatedStudent.sessionVersion).toBeGreaterThan(initialSessionVersion);

    // Old token should now be rejected
    const res = await request(app)
      .get('/api/dashboard/student')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(401);
    expect(res.body.message).toMatch(/Session expired or revoked/i);
  });

  it('should lock account after 5 failed attempts', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: student.email, password: 'wrongpassword' });
      
      expect(res.statusCode).toEqual(401);
      if (i === 4) {
        expect(res.body.message).toMatch(/Account temporarily locked/i);
      }
    }

    // Next request with valid password should fail because account is locked
    const lockedRes = await request(app)
      .post('/api/auth/login')
      .send({ email: student.email, password: studentPassword });
    
    expect(lockedRes.statusCode).toEqual(429);
    expect(lockedRes.body.message).toMatch(/Account temporarily locked/i);

    // Verify SecurityEvent was created
    const lockEvent = await SecurityEvent.findOne({ targetId: student._id, eventType: 'account_locked' });
    expect(lockEvent).toBeTruthy();
  });
});
