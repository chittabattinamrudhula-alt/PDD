/**
 * PropAI Spike Test - Sudden traffic burst
 * Normal → 500 VU spike → back to normal
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, THRESHOLDS } from './config.js';
import { JSON_HEADERS } from './helpers.js';

export const options = {
  stages: [
    { duration: '1m',  target: 10  }, // warm up
    { duration: '30s', target: 500 }, // spike!
    { duration: '1m',  target: 500 }, // hold spike
    { duration: '30s', target: 10  }, // ramp down
    { duration: '1m',  target: 0   }, // cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<8000'],
    http_req_failed:   ['rate<0.15'],
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/properties`);
  check(res, {
    'spike - properties ok': (r) => r.status === 200,
    'spike - fast enough':   (r) => r.timings.duration < 8000,
  });

  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: 'buyer@propai.com', password: 'password' }),
    { headers: JSON_HEADERS }
  );
  check(loginRes, { 'spike - login ok': (r) => r.status === 200 });

  sleep(0.5);
}
