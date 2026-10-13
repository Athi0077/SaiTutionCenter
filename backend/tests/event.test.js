const request = require('supertest');
const mongoose = require('mongoose');
const { app, server } = require('../server');
const User = require('../src/models/User');
const SchoolEvent = require('../src/models/SchoolEvent');
const EventRegistration = require('../src/models/EventRegistration');
const EventResult = require('../src/models/EventResult');
const Class = require('../src/models/Class');
const jwt = require('jsonwebtoken');

describe('Event Management Integration Tests', () => {
  let principalToken, teacherToken, student1Token, student2Token;
  let principal, teacher, student1, student2;
  let classDoc;
  let eventId;

  beforeAll(async () => {
    await User.deleteMany({});
    await SchoolEvent.deleteMany({});
    await EventRegistration.deleteMany({});
    await EventResult.deleteMany({});
    await Class.deleteMany({});

    // Create users
    principal = await User.create({
      name: 'Principal Bob', email: 'principal@test.com', password: 'password', role: 'principal'
    });
    teacher = await User.create({
      name: 'Teacher Alice', email: 'teacher@test.com', password: 'password', role: 'teacher'
    });
    student1 = await User.create({
      name: 'Student Tim', email: 'tim@test.com', password: 'password', role: 'student', studentId: 'S001'
    });
    student2 = await User.create({
      name: 'Student Sam', email: 'sam@test.com', password: 'password', role: 'student', studentId: 'S002'
    });

    // Create class and assign students
    classDoc = await Class.create({
      className: '10 - A', standard: '10', section: 'A', teacherId: teacher._id,
      students: [student1._id, student2._id]
    });

    // Generate tokens
    principalToken = jwt.sign({ userId: principal._id }, process.env.JWT_SECRET);
    teacherToken = jwt.sign({ userId: teacher._id }, process.env.JWT_SECRET);
    student1Token = jwt.sign({ userId: student1._id }, process.env.JWT_SECRET);
    student2Token = jwt.sign({ userId: student2._id }, process.env.JWT_SECRET);
  });

  afterAll(async () => {
    await mongoose.connection.close();
    server.close();
  });

  describe('PHASE 1: Principal Event Creation & Management', () => {
    it('should create an event as draft', async () => {
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${principalToken}`)
        .send({
          title: 'Sports Day',
          category: 'Sports',
          topic: 'Running',
          eventDate: new Date().toISOString(),
          venue: 'Main Ground',
          registrationDeadline: new Date(Date.now() + 86400000).toISOString(),
          eligibleClasses: ['10 - A']
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('draft');
      eventId = res.body.data._id;
    });

    it('teacher should not see draft events', async () => {
      const res = await request(app)
        .get('/api/events')
        .set('Authorization', `Bearer ${teacherToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0); // Drafts shouldn't be returned
    });

    it('principal can publish the event', async () => {
      const res = await request(app)
        .put(`/api/events/${eventId}/status`)
        .set('Authorization', `Bearer ${principalToken}`)
        .send({ status: 'published' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('published');
    });

    it('teacher can now see published events', async () => {
      const res = await request(app)
        .get('/api/events')
        .set('Authorization', `Bearer ${teacherToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe('PHASE 3: Student Registration', () => {
    it('student1 can join eligible published event', async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/join`)
        .set('Authorization', `Bearer ${student1Token}`);
      
      expect(res.status).toBe(201);
      expect(res.body.message).toMatch(/Successfully registered/);
    });

    it('student1 cannot join twice', async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/join`)
        .set('Authorization', `Bearer ${student1Token}`);
      
      expect(res.status).toBe(400); // Bad request, duplicate
    });
  });

  describe('PHASE 4: Results Workflow', () => {
    it('principal marks event as completed', async () => {
      await request(app)
        .put(`/api/events/${eventId}/status`)
        .set('Authorization', `Bearer ${principalToken}`)
        .send({ status: 'completed' });
    });

    it('teacher submits results for completed event', async () => {
      const res = await request(app)
        .post(`/api/events/${eventId}/results`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          firstPlace: student1._id.toString()
        });
      
      expect(res.status).toBe(200);
      expect(res.body.data.resultStatus).toBe('submitted');
    });

    it('principal approves and publishes results', async () => {
      const res = await request(app)
        .put(`/api/events/${eventId}/results/review`)
        .set('Authorization', `Bearer ${principalToken}`)
        .send({ action: 'publish' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.resultStatus).toBe('published');
    });

    it('student1 can view published results', async () => {
      const res = await request(app)
        .get(`/api/events/${eventId}/results`)
        .set('Authorization', `Bearer ${student1Token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.firstPlace.name).toBe('Student Tim');
    });
  });
});
