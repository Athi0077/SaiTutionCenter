const request = require('supertest');
const app = require('../server');
const User = require('../src/models/User');
const Settings = require('../src/models/Settings');
const mongoose = require('mongoose');

describe('Super Admin Endpoints', () => {
  let superAdminToken;
  let teacherToken;
  
  beforeAll(async () => {
    await User.deleteMany({});
    await Settings.deleteMany({});
    
    // Create Super Admin
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'owner@example.com',
      password: 'password123',
      role: 'superadmin',
      status: 'active'
    });

    // Create a regular teacher for testing unauthorized access
    const teacher = await User.create({
      name: 'Teacher One',
      email: 'teacher@example.com',
      password: 'password123',
      role: 'teacher',
      status: 'active'
    });

    // Login super admin
    const saLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@example.com', password: 'password123' });
    superAdminToken = saLogin.body.token;

    // Login teacher
    const tLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teacher@example.com', password: 'password123' });
    teacherToken = tLogin.body.token;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/super-admin/dashboard', () => {
    it('should deny access to non-superadmin users', async () => {
      const res = await request(app)
        .get('/api/super-admin/dashboard')
        .set('Authorization', `Bearer ${teacherToken}`);
      
      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toBe('Action restricted to Super Admin only');
    });

    it('should allow access to superadmin and return correct stats', async () => {
      const res = await request(app)
        .get('/api/super-admin/dashboard')
        .set('Authorization', `Bearer ${superAdminToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats.teacher).toEqual(1); // One teacher created in beforeAll
      expect(res.body.totalRegistered).toEqual(1);
    });
  });

  describe('GET /api/super-admin/account-counts', () => {
    it('should return valid account counts excluding superadmin', async () => {
      const res = await request(app)
        .get('/api/super-admin/account-counts')
        .set('Authorization', `Bearer ${superAdminToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.counts.teacher).toEqual(1);
    });
  });

  describe('GET & PUT /api/super-admin/calculator', () => {
    it('should get default calculator amounts', async () => {
      const res = await request(app)
        .get('/api/super-admin/calculator')
        .set('Authorization', `Bearer ${superAdminToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.amounts.teacher).toEqual(0);
      expect(res.body.grandTotal).toEqual(0);
    });

    it('should update calculator amounts and recalculate totals', async () => {
      const payload = {
        student: 100,
        teacher: 500,
        principal: 1000,
        parent: 50
      };

      const res = await request(app)
        .put('/api/super-admin/calculator')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(payload);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.amounts.teacher).toEqual(500);
      
      // Since there is 1 teacher, teacher total = 1 * 500 = 500
      expect(res.body.totals.teacher).toEqual(500);
      expect(res.body.grandTotal).toEqual(500);
    });

    it('should reject invalid or negative amounts', async () => {
      const payload = {
        student: -100,
        teacher: 500,
        principal: 1000,
        parent: 50
      };

      const res = await request(app)
        .put('/api/super-admin/calculator')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(payload);
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid amounts');
    });
  });
});
