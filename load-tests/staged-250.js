import { studentBehavior, teacherBehavior, principalBehavior } from './test.js';

export const options = {
  thresholds: {
    'http_req_duration': [{ threshold: 'p(95)<3000', abortOnFail: true }], 
    'http_req_failed': [{ threshold: 'rate<0.05', abortOnFail: true }],
  },
  scenarios: {
    student_traffic: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 200 }, // 80% of 250
        { duration: '30s', target: 200 },
        { duration: '5s', target: 0 },
      ],
      exec: 'studentTraffic',
    },
    teacher_traffic: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 45 },  // 18% of 250
        { duration: '30s', target: 45 },
        { duration: '5s', target: 0 },
      ],
      exec: 'teacherTraffic',
    },
    principal_traffic: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 5 },   // 2% of 250
        { duration: '30s', target: 5 },
        { duration: '5s', target: 0 },
      ],
      exec: 'principalTraffic',
    }
  }
};

export function studentTraffic() { studentBehavior(); }
export function teacherTraffic() { teacherBehavior(); }
export function principalTraffic() { principalBehavior(); }
