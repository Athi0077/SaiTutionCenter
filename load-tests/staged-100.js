import { studentBehavior, teacherBehavior, principalBehavior } from './test.js';

export const options = {
  thresholds: {
    'http_req_duration': [{ threshold: 'p(95)<3000', abortOnFail: true }], // Abort if p95 > 3s
    'http_req_failed': [{ threshold: 'rate<0.05', abortOnFail: true }], // Abort if > 5% fail
  },
  scenarios: {
    student_traffic: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 80 },  // short ramp-up
        { duration: '30s', target: 80 }, // run for 30 seconds
        { duration: '5s', target: 0 },   // short ramp-down
      ],
      exec: 'studentTraffic',
    },
    teacher_traffic: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 18 },
        { duration: '30s', target: 18 },
        { duration: '5s', target: 0 },
      ],
      exec: 'teacherTraffic',
    },
    principal_traffic: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 2 },
        { duration: '30s', target: 2 },
        { duration: '5s', target: 0 },
      ],
      exec: 'principalTraffic',
    }
  }
};

// Wrapper functions required because k6 needs to resolve the 'exec' name in the current module's exported functions
export function studentTraffic() {
  studentBehavior();
}

export function teacherTraffic() {
  teacherBehavior();
}

export function principalTraffic() {
  principalBehavior();
}
