const request = require('supertest');
const app = require('../server');
const User = require('../src/models/User');
const MotivationalQuote = require('../src/models/MotivationalQuote');

let principal, teacher, student;
let pToken, tToken, sToken;

beforeEach(async () => {
  principal = await User.create({ name: 'Principal', email: 'p@test.com', password: 'password', role: 'principal' });
  teacher = await User.create({ name: 'Teacher', email: 't@test.com', password: 'password', role: 'teacher' });
  student = await User.create({ name: 'Student', email: 's@test.com', studentId: 'S1', password: 'password', role: 'student', mustChangePassword: false });

  pToken = (await request(app).post('/api/auth/login').send({ email: 'p@test.com', password: 'password' })).body.token;
  tToken = (await request(app).post('/api/auth/login').send({ email: 't@test.com', password: 'password' })).body.token;
  sToken = (await request(app).post('/api/auth/login').send({ email: 's@test.com', password: 'password' })).body.token;
});

describe('Motivational Quote System Tests', () => {

  it('principal can create, publish, and fetch quotes', async () => {
    // 1. Create a quote
    const createRes = await request(app)
      .post('/api/quotes')
      .set('Authorization', `Bearer ${pToken}`)
      .send({ quote: 'Be the change', audience: 'students' });
    
    expect(createRes.statusCode).toEqual(201);
    const quoteId = createRes.body.data._id;
    
    // 2. Teacher cannot create
    const badRes = await request(app)
      .post('/api/quotes')
      .set('Authorization', `Bearer ${tToken}`)
      .send({ quote: 'Bad quote', audience: 'students' });
    expect(badRes.statusCode).toEqual(403);

    // 3. Publish the quote
    const pubRes = await request(app)
      .post(`/api/quotes/${quoteId}/publish`)
      .set('Authorization', `Bearer ${pToken}`);
    expect(pubRes.statusCode).toEqual(200);

    // 4. Student sees the quote
    const currRes = await request(app)
      .get('/api/quotes/current')
      .set('Authorization', `Bearer ${sToken}`);
    expect(currRes.statusCode).toEqual(200);
    expect(currRes.body.data.quote).toEqual('Be the change');

    // 5. Teacher does not see the students quote
    const tCurrRes = await request(app)
      .get('/api/quotes/current')
      .set('Authorization', `Bearer ${tToken}`);
    expect(tCurrRes.body.data).toBeNull();
  });

  it('both audience quote is visible to everyone and handles overwrites', async () => {
    const q1 = await MotivationalQuote.create({ quote: 'Q1', audience: 'both', status: 'draft', createdBy: principal._id });
    const q2 = await MotivationalQuote.create({ quote: 'Q2', audience: 'students', status: 'draft', createdBy: principal._id });

    await request(app).post(`/api/quotes/${q1._id}/publish`).set('Authorization', `Bearer ${pToken}`);
    
    let res = await request(app).get('/api/quotes/current').set('Authorization', `Bearer ${tToken}`);
    expect(res.body.data.quote).toEqual('Q1');
    
    // Now publish Q2 (students only)
    await request(app).post(`/api/quotes/${q2._id}/publish`).set('Authorization', `Bearer ${pToken}`);

    // Student should see Q2
    res = await request(app).get('/api/quotes/current').set('Authorization', `Bearer ${sToken}`);
    expect(res.body.data.quote).toEqual('Q2');
    
    // Teacher should still see Q1 because Q2 was 'students' so it shouldn't have archived 'both'
    res = await request(app).get('/api/quotes/current').set('Authorization', `Bearer ${tToken}`);
    expect(res.body.data.quote).toEqual('Q1');
  });

});
