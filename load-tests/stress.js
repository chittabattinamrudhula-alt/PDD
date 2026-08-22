/**
 * PropAI Stress Test - Ramp up to find breaking point
 * Stages: 0→50 (2m) → 100 (3m) → 200 (2m) → 300 (2m) → 0 (1m)
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, THRESHOLDS } from './config.js';
import { JSON_HEADERS } from './helpers.js';

export const options = {
  stages: [
    { duration: '2m', target: 50  },
    { duration: '3m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '2m', target: 300 },
    { duration: '1m', target: 0   },
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'],
    http_req_failed:   ['rate<0.10'],
    checks:            ['rate>0.85'],
  },
};

export default function () {
  const responses = http.batch([
    ['GET',  `${BASE_URL}/properties`],
    ['GET',  `${BASE_URL}/blockchain/ledger`],
    ['GET',  `${BASE_URL}/market/trends`],
    ['POST', `${BASE_URL}/auth/login`,
      JSON.stringify({ email: 'buyer@propai.com', password: 'password' }),
      { headers: JSON_HEADERS }
    ],
    ['POST', `${BASE_URL}/valuation/predict`,
      JSON.stringify({ location: 'Beachfront', sqft: 1500, bedrooms: 3, bathrooms: 2, age: 8, condition: 'Good', amenities: [], listingPrice: 750000 }),
      { headers: JSON_HEADERS }
    ],
  ]);

  responses.forEach((res, i) => {
    check(res, {
      [`stress req ${i} ok`]: (r) => r.status < 500,
    });
  });

  sleep(Math.random() * 2 + 0.5);
}
