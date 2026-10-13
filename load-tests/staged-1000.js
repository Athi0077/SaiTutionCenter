import { studentBehavior, teacherBehavior, principalBehavior } from './test.js';

export const options = {
  thresholds: {
    'http_req_duration': ['p(95)<4000'], // Allowing 4s p95 since 1000 VUs is a massive load for a local machine
    'http_req_failed': [{ threshold: 'rate<0.05', abortOnFail: true }],
  },
  scenarios: {
    student_traffic: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 800 }, 
        { duration: '30s', target: 800 },
        { duration: '10s', target: 0 },
      ],
      exec: 'studentTraffic',
    },
    teacher_traffic: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 180 },  
        { duration: '30s', target: 180 },
        { duration: '10s', target: 0 },
      ],
      exec: 'teacherTraffic',
    },
    principal_traffic: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 20 },   
        { duration: '30s', target: 20 },
        { duration: '10s', target: 0 },
      ],
      exec: 'principalTraffic',
    }
  }
};

export function studentTraffic() { studentBehavior(); }
export function teacherTraffic() { teacherBehavior(); }
export function principalTraffic() { principalBehavior(); }
