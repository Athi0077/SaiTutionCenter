import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

// Load users data
const data = new SharedArray('users', function () {
  return [JSON.parse(open('./data/users.json'))];
});
const users = data[0];

const BASE_URL = 'http://localhost:5000/api';

const isSmokeTest = __ENV.SMOKE === 'true';

export const options = {
  thresholds: {
    'http_req_duration': [{ threshold: 'p(95)<3000', abortOnFail: true }], // Abort if p95 > 3s
    'http_req_failed': [{ threshold: 'rate<0.05', abortOnFail: true }], // Abort if > 5% fail
    'http_req_duration{endpoint:student_dashboard}': ['p(95)<2000'],
    'http_req_duration{endpoint:teacher_dashboard}': ['p(95)<2000'],
    'http_req_duration{endpoint:principal_dashboard}': ['p(95)<2000'],
    'http_req_duration{endpoint:submit_homework}': ['p(95)<2000'],
    'http_req_duration{endpoint:mark_attendance}': ['p(95)<2000'],
  },
  scenarios: {
    student_traffic: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: isSmokeTest ? [
        { duration: '10s', target: 5 },
        { duration: '20s', target: 5 },
        { duration: '10s', target: 0 },
      ] : [
        // 50
        { duration: '15s', target: 40 },
        { duration: '30s', target: 40 },
        // 100
        { duration: '15s', target: 80 },
        { duration: '30s', target: 80 },
        // 250
        { duration: '15s', target: 200 },
        { duration: '30s', target: 200 },
        // 500
        { duration: '15s', target: 400 },
        { duration: '30s', target: 400 },
        // 750
        { duration: '15s', target: 600 },
        { duration: '30s', target: 600 },
        // 1000
        { duration: '15s', target: 800 },
        { duration: '30s', target: 800 },
        // Ramp down
        { duration: '30s', target: 0 },
      ],
      exec: 'studentBehavior',
    },
    teacher_traffic: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: isSmokeTest ? [
        { duration: '10s', target: 2 },
        { duration: '20s', target: 2 },
        { duration: '10s', target: 0 },
      ] : [
        { duration: '15s', target: 8 },
        { duration: '30s', target: 8 },
        { duration: '15s', target: 18 },
        { duration: '30s', target: 18 },
        { duration: '15s', target: 45 },
        { duration: '30s', target: 45 },
        { duration: '15s', target: 90 },
        { duration: '30s', target: 90 },
        { duration: '15s', target: 135 },
        { duration: '30s', target: 135 },
        { duration: '15s', target: 180 },
        { duration: '30s', target: 180 },
        { duration: '30s', target: 0 },
      ],
      exec: 'teacherBehavior',
    },
    principal_traffic: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: isSmokeTest ? [
        { duration: '5s', target: 1 },
        { duration: '25s', target: 1 },
        { duration: '5s', target: 0 },
      ] : [
        { duration: '15s', target: 2 },
        { duration: '30s', target: 2 },
        { duration: '15s', target: 2 },
        { duration: '30s', target: 2 },
        { duration: '15s', target: 5 },
        { duration: '30s', target: 5 },
        { duration: '15s', target: 10 },
        { duration: '30s', target: 10 },
        { duration: '15s', target: 15 },
        { duration: '30s', target: 15 },
        { duration: '15s', target: 20 },
        { duration: '30s', target: 20 },
        { duration: '30s', target: 0 },
      ],
      exec: 'principalBehavior',
    }
  }
};

function getHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

// Helper to pick random item
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function studentBehavior() {
  const student = randomItem(users.students);
  const params = { headers: getHeaders(student.token), tags: {} };

  // 1. Dashboard
  params.tags.endpoint = 'student_dashboard';
  let res = http.get(`${BASE_URL}/dashboard/student`, params);
  
  if (isSmokeTest && res.status !== 200) {
    console.log('--- SMOKE TEST DIAGNOSTIC ---');
    console.log(`Student ID: ${student.id}`);
    console.log(`Has Auth Header: ${!!params.headers.Authorization}`);
    // Print first 20 chars of token safely
    const safeToken = params.headers.Authorization ? params.headers.Authorization.substring(0, 27) + '...' : 'none';
    console.log(`Auth Header starts with: ${safeToken}`);
    console.log(`HTTP Status: ${res.status}`);
    console.log(`Response Body: ${res.body}`);
    console.log('-----------------------------');
  }

  check(res, { 'status is 200 (student dashboard)': (r) => r.status === 200 });
  sleep(Math.random() * 2 + 1);

  // 2. Attendance
  params.tags.endpoint = 'student_attendance';
  res = http.get(`${BASE_URL}/attendance/my`, params);
  check(res, { 'status is 200 (student attendance)': (r) => r.status === 200 });
  sleep(Math.random() * 2 + 1);

  // 3. Homework
  params.tags.endpoint = 'student_homework';
  res = http.get(`${BASE_URL}/homework/student`, params);
  check(res, { 'status is 200 (student homework)': (r) => r.status === 200 });
  
  // Submit homework rarely to avoid excessive data but still test concurrency
  if (Math.random() < 0.2) {
    // Find homework assigned to this student's class
    const hws = users.homework.filter(h => h.classId === student.classId);
    if (hws.length > 0) {
      const hw = randomItem(hws);
      params.tags.endpoint = 'submit_homework';
      const payload = JSON.stringify({ answerText: "Done by k6 load test" });
      let hwRes = http.post(`${BASE_URL}/homework/${hw.id}/submit`, payload, params);
      check(hwRes, { 'status is 201 or 400 (submit hw)': (r) => r.status === 201 || r.status === 400 }); 
      // 400 is fine if already submitted
    }
  }
  sleep(Math.random() * 2 + 1);
  
  // 4. Leave request
  if (Math.random() < 0.1) {
    params.tags.endpoint = 'student_leave';
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const payload = JSON.stringify({ date: tomorrow, reason: "Sick leave test" });
    let leaveRes = http.post(`${BASE_URL}/leave-requests`, payload, params);
    check(leaveRes, { 'status is 201 or 400 (leave req)': (r) => r.status === 201 || r.status === 400 });
  }
  sleep(Math.random() * 2 + 1);
}

export function teacherBehavior() {
  const teacher = randomItem(users.teachers);
  const params = { headers: getHeaders(teacher.token), tags: {} };

  // 1. Dashboard
  params.tags.endpoint = 'teacher_dashboard';
  let res = http.get(`${BASE_URL}/dashboard/teacher`, params);
  check(res, { 'status is 200 (teacher dashboard)': (r) => r.status === 200 });
  sleep(Math.random() * 2 + 1);

  // 2. Mark Attendance (only if teacher has a class)
  const teacherClasses = users.classes.filter(c => c.teacherId === teacher.id);
  if (teacherClasses.length > 0) {
    const tClass = randomItem(teacherClasses);
    params.tags.endpoint = 'mark_attendance';
    
    // Get students for this class
    const classStudents = users.students.filter(s => s.classId === tClass.id);
    const attendancePayload = classStudents.map(s => ({
      studentId: s.id,
      status: Math.random() < 0.9 ? 'present' : 'absent'
    }));
    
    const today = new Date().toISOString().split('T')[0];
    const payload = JSON.stringify({
      classId: tClass.id,
      date: today,
      session: 'MORNING',
      attendance: attendancePayload
    });

    let attRes = http.post(`${BASE_URL}/attendance/session`, payload, params);
    // 409 means already submitted which is fine for concurrency idempotency test
    check(attRes, { 'status is 201 or 409 (mark attendance)': (r) => r.status === 201 || r.status === 409 });
    sleep(Math.random() * 2 + 1);
  }

  // 3. View teacher leave requests
  params.tags.endpoint = 'teacher_leave_reqs';
  res = http.get(`${BASE_URL}/leave-requests/teacher`, params);
  check(res, { 'status is 200 (teacher leave reqs)': (r) => r.status === 200 });
  sleep(Math.random() * 2 + 1);
}

export function principalBehavior() {
  const principal = users.principal;
  const params = { headers: getHeaders(principal.token), tags: {} };

  // 1. Dashboard
  params.tags.endpoint = 'principal_dashboard';
  let res = http.get(`${BASE_URL}/dashboard/principal`, params);
  check(res, { 'status is 200 (principal dashboard)': (r) => r.status === 200 });
  sleep(Math.random() * 2 + 1);

  // 2. Attendance Overview
  params.tags.endpoint = 'principal_attendance';
  const today = new Date().toISOString().split('T')[0];
  res = http.get(`${BASE_URL}/attendance/overview?date=${today}`, params);
  check(res, { 'status is 200 (principal att overview)': (r) => r.status === 200 });
  sleep(Math.random() * 2 + 1);

  // 3. Homework Overview
  params.tags.endpoint = 'principal_homework';
  res = http.get(`${BASE_URL}/homework/admin-overview`, params);
  check(res, { 'status is 200 (principal hw overview)': (r) => r.status === 200 });
  sleep(Math.random() * 2 + 1);
}
