const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../src/models/User');
const Standard = require('../src/models/Standard');
const Section = require('../src/models/Section');
const Class = require('../src/models/Class');
const TeacherAssignment = require('../src/models/TeacherAssignment');
const Quiz = require('../src/models/Quiz');
const QuizSubmission = require('../src/models/QuizSubmission');
const jwt = require('jsonwebtoken');

describe('StudyMate — Fun Activities Module Tests (Category-based Activity System)', () => {
  let teacherToken, teacherUser;
  let unauthorizedTeacherToken, unauthorizedTeacherUser;
  let student6AToken, student6AUser;
  let student7BToken, student7BUser;
  let principalToken, principalUser;

  let std6, secA, std7, secB;
  let class6A, class7B;

  beforeEach(async () => {
    // 1. Create Principal
    principalUser = await User.create({
      name: 'Principal User',
      email: 'principal@test.com',
      password: 'password123',
      role: 'principal',
      status: 'active',
    });
    principalToken = jwt.sign({ id: principalUser._id, role: 'principal' }, process.env.JWT_SECRET || 'test_jwt_secret_for_auth');

    // 2. Create Teachers
    teacherUser = await User.create({
      name: 'Teacher 1',
      email: 'teacher1@test.com',
      password: 'password123',
      role: 'teacher',
      status: 'active',
    });
    teacherToken = jwt.sign({ id: teacherUser._id, role: 'teacher' }, process.env.JWT_SECRET || 'test_jwt_secret_for_auth');

    unauthorizedTeacherUser = await User.create({
      name: 'Teacher 2',
      email: 'teacher2@test.com',
      password: 'password123',
      role: 'teacher',
      status: 'active',
    });
    unauthorizedTeacherToken = jwt.sign({ id: unauthorizedTeacherUser._id, role: 'teacher' }, process.env.JWT_SECRET || 'test_jwt_secret_for_auth');

    // 3. Create Students
    student6AUser = await User.create({
      name: 'Student 6A',
      email: 'student6a@test.com',
      password: 'password123',
      role: 'student',
      status: 'active',
    });
    student6AToken = jwt.sign({ id: student6AUser._id, role: 'student' }, process.env.JWT_SECRET || 'test_jwt_secret_for_auth');

    student7BUser = await User.create({
      name: 'Student 7B',
      email: 'student7b@test.com',
      password: 'password123',
      role: 'student',
      status: 'active',
    });
    student7BToken = jwt.sign({ id: student7BUser._id, role: 'student' }, process.env.JWT_SECRET || 'test_jwt_secret_for_auth');

    // 4. Create Standards & Sections
    std6 = await Standard.create({ name: '6th', createdBy: principalUser._id });
    secA = await Section.create({ name: 'A', standardId: std6._id, createdBy: principalUser._id });

    std7 = await Standard.create({ name: '7th', createdBy: principalUser._id });
    secB = await Section.create({ name: 'B', standardId: std7._id, createdBy: principalUser._id });

    // 5. Create Classes and assign students
    class6A = await Class.create({
      standard: '6th',
      section: 'A',
      className: '6th - A',
      teacherId: teacherUser._id,
      students: [student6AUser._id],
      status: 'active',
    });

    class7B = await Class.create({
      standard: '7th',
      section: 'B',
      className: '7th - B',
      teacherId: unauthorizedTeacherUser._id,
      students: [student7BUser._id],
      status: 'active',
    });

    // 6. Assign Teacher 1 to 6th-A Tamil & 7th-B English
    await TeacherAssignment.create({
      teacherId: teacherUser._id,
      standardId: std6._id,
      sectionId: secA._id,
      subject: 'Tamil',
      assignedBy: principalUser._id,
    });

    await TeacherAssignment.create({
      teacherId: teacherUser._id,
      standardId: std7._id,
      sectionId: secB._id,
      subject: 'English',
      assignedBy: principalUser._id,
    });
  });

  describe('1. Teacher Authorization for Activity Creation', () => {
    it('allows Teacher 1 to create quiz for assigned class & subject (6th-A Tamil) -> PASS', async () => {
      const res = await request(app)
        .post('/api/fun-activities/quizzes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          activityType: 'quiz',
          title: 'Tamil Grammar Challenge',
          description: 'Class 6A Tamil Quiz',
          standardId: std6._id,
          sectionId: secA._id,
          subject: 'Tamil',
          startDate: new Date(Date.now() - 3600000).toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          timeLimit: 15,
          questions: [
            {
              question: 'தமிழின் முதல் எழுத்து எது?',
              options: [
                { key: 'A', text: 'அ' },
                { key: 'B', text: 'க' },
                { key: 'C', text: 'ச' },
                { key: 'D', text: 'த' },
              ],
              correctAnswer: 'A',
              marks: 1,
            }
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Tamil Grammar Challenge');
      expect(res.body.data.activityType).toBe('quiz');
    });

    it('allows Teacher 1 to create Word Scramble for assigned class & subject -> PASS', async () => {
      const res = await request(app)
        .post('/api/fun-activities/quizzes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          activityType: 'word_scramble',
          title: 'Tamil Word Scramble',
          standardId: std6._id,
          sectionId: secA._id,
          subject: 'Tamil',
          startDate: new Date(Date.now() - 3600000).toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          questions: [
            { word: 'SCHOOL', hint: 'Place for learning', marks: 1 }
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.activityType).toBe('word_scramble');
    });

    it('rejects Teacher 1 when attempting to create activity for unassigned subject (6th-A Science) -> FAIL 403', async () => {
      const res = await request(app)
        .post('/api/fun-activities/quizzes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          activityType: 'maths_challenge',
          title: 'Science Challenge',
          standardId: std6._id,
          sectionId: secA._id,
          subject: 'Science', // Teacher 1 is NOT assigned to Science
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          questions: [
            {
              question: 'What is H2O?',
              options: [
                { key: 'A', text: 'Water' },
                { key: 'B', text: 'Air' },
                { key: 'C', text: 'Fire' },
                { key: 'D', text: 'Earth' },
              ],
              correctAnswer: 'A',
              marks: 1,
            }
          ],
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not authorized');
    });
  });

  describe('2. Category Specific Answers & Server-Side Scoring', () => {
    it('evaluates Fill in the Blanks with normalized case-insensitive comparison -> PASS', async () => {
      const activity = await Quiz.create({
        activityType: 'fill_blank',
        title: 'Tamil Geography Blank',
        standardId: std6._id,
        sectionId: secA._id,
        subject: 'Tamil',
        createdBy: teacherUser._id,
        startDate: new Date(Date.now() - 3600000),
        endDate: new Date(Date.now() + 86400000),
        totalMarks: 1,
        questions: [
          {
            blankQuestion: 'The capital of Tamil Nadu is ________.',
            blankAnswer: 'Chennai',
            marks: 1,
          }
        ],
      });

      const res = await request(app)
        .post(`/api/fun-activities/quizzes/${activity._id}/submit`)
        .set('Authorization', `Bearer ${student6AToken}`)
        .send({
          answers: [
            { questionId: activity.questions[0]._id, selectedAnswer: '  chennai ' } // Case-insensitive & trimmed
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.score).toBe(1);
      expect(res.body.data.percentage).toBe(100);
    });

    it('sanitizes student fetch payload by hiding answers and scrambling words -> PASS', async () => {
      const scrambleActivity = await Quiz.create({
        activityType: 'word_scramble',
        title: 'Secret Word Challenge',
        standardId: std6._id,
        sectionId: secA._id,
        subject: 'Tamil',
        createdBy: teacherUser._id,
        startDate: new Date(Date.now() - 3600000),
        endDate: new Date(Date.now() + 86400000),
        totalMarks: 1,
        questions: [
          { word: 'SCHOOL', hint: 'Learning center', marks: 1 }
        ],
      });

      const res = await request(app)
        .get(`/api/fun-activities/quizzes/${scrambleActivity._id}`)
        .set('Authorization', `Bearer ${student6AToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.questions[0].word).toBeUndefined(); // Word must NOT be exposed!
      expect(res.body.data.questions[0].scrambledWord).toBeDefined();
      expect(res.body.data.questions[0].hint).toBe('Learning center');
    });

    it('rejects duplicate submission for any activity category -> REJECT 400', async () => {
      const tfActivity = await Quiz.create({
        activityType: 'true_false',
        title: 'Sun Star Statement',
        standardId: std6._id,
        sectionId: secA._id,
        subject: 'Tamil',
        createdBy: teacherUser._id,
        startDate: new Date(Date.now() - 3600000),
        endDate: new Date(Date.now() + 86400000),
        totalMarks: 1,
        questions: [
          { statement: 'The Sun is a star.', isTrue: true, correctAnswer: 'true', marks: 1 }
        ],
      });

      // Submit 1
      await request(app)
        .post(`/api/fun-activities/quizzes/${tfActivity._id}/submit`)
        .set('Authorization', `Bearer ${student6AToken}`)
        .send({
          answers: [{ questionId: tfActivity.questions[0]._id, selectedAnswer: 'true' }]
        });

      // Submit 2 (Duplicate)
      const res = await request(app)
        .post(`/api/fun-activities/quizzes/${tfActivity._id}/submit`)
        .set('Authorization', `Bearer ${student6AToken}`)
        .send({
          answers: [{ questionId: tfActivity.questions[0]._id, selectedAnswer: 'true' }]
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already submitted');
    });
  });

  describe('3. Principal Monitoring Overview across Categories', () => {
    it('allows Principal to view overview with category counts -> PASS', async () => {
      const res = await request(app)
        .get('/api/fun-activities/principal/overview')
        .set('Authorization', `Bearer ${principalToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.metrics.categoryCounts).toBeDefined();
    });
  });
});
