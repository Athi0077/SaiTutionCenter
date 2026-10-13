import { studentBehavior, teacherBehavior, principalBehavior } from './test.js';

export const options = {
  thresholds: {
    'http_req_duration': ['p(95)<3000'], // Removed abortOnFail to see full results
    'http_req_failed': [{ threshold: 'rate<0.05', abortOnFail: true }],
  },
  scenarios: {
    student_traffic: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 400 }, // Slower ramp-up to prevent DDOS spike
        { duration: '30s', target: 400 },
        { duration: '10s', target: 0 },
      ],
      exec: 'studentTraffic',
    },
    teacher_traffic: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 90 },  
        { duration: '30s', target: 90 },
        { duration: '10s', target: 0 },
      ],
      exec: 'teacherTraffic',
    },
    principal_traffic: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 10 },   
        { duration: '30s', target: 10 },
        { duration: '10s', target: 0 },
      ],
      exec: 'principalTraffic',
    }
  }
};

export function studentTraffic() { studentBehavior(); }
export function teacherTraffic() { teacherBehavior(); }
export function principalTraffic() { principalBehavior(); }
