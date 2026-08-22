/**
 * PropAI Baseline Load Test
 * 100 Virtual Users | 1 Minute
 * Tests: GET Properties, GET Ledger, POST Login, POST Valuation, GET Bookings
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { BASE_URL, THRESHOLDS } from './config.js';
import { JSON_HEADERS, login, randomProperty } from './helpers.js';

// Custom metrics
const loginDuration    = new Trend('login_duration');
const propertiesDur    = new Trend('properties_duration');
const valuationDur     = new Trend('valuation_duration');
const errorRate        = new Rate('error_rate');
const totalRequests    = new Counter('total_requests');

export const options = {
  vus: 100,
  duration: '1m',
  thresholds: {
    ...THRESHOLDS,
    login_duration:      ['p(95)<3000'],
    properties_duration: ['p(95)<2000'],
    valuation_duration:  ['p(95)<3000'],
    error_rate:          ['rate<0.05'],
  },
};

export default function () {
  totalRequests.add(1);

  // 1. GET Properties
  const propsStart = Date.now();
  const propsRes = http.get(`${BASE_URL}/properties`);
  propertiesDur.add(Date.now() - propsStart);
  check(propsRes, {
    'GET /properties status 200': (r) => r.status === 200,
    'GET /properties has array': (r) => Array.isArray(r.json()),
    'GET /properties not empty': (r) => r.json().length > 0,
    'GET /properties response time < 2s': (r) => r.timings.duration < 2000,
  }) || errorRate.add(1);

  sleep(0.5);

  // 2. GET Ledger
  const ledgerRes = http.get(`${BASE_URL}/blockchain/ledger`);
  check(ledgerRes, {
    'GET /ledger status 200': (r) => r.status === 200,
    'GET /ledger has genesis block': (r) => Array.isArray(r.json()) && r.json()[0]?.index === 0,
  }) || errorRate.add(1);

  sleep(0.5);

  // 3. GET Market Trends
  const trendsRes = http.get(`${BASE_URL}/market/trends`);
  check(trendsRes, {
    'GET /market/trends status 200': (r) => r.status === 200,
    'GET /market/trends has data': (r) => Object.keys(r.json()).length > 0,
  }) || errorRate.add(1);

  sleep(0.3);

  // 4. POST Login (buyer)
  const loginStart = Date.now();
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: 'buyer@propai.com', password: 'password' }),
    { headers: JSON_HEADERS }
  );
  loginDuration.add(Date.now() - loginStart);
  check(loginRes, {
    'POST /auth/login status 200': (r) => r.status === 200,
    'POST /auth/login returns user': (r) => r.json('email') === 'buyer@propai.com',
    'POST /auth/login has role': (r) => r.json('role') === 'Buyer',
    'POST /auth/login response time < 3s': (r) => r.timings.duration < 3000,
  }) || errorRate.add(1);

  sleep(0.5);

  // 5. POST Valuation Predict
  const valStart = Date.now();
  const valRes = http.post(
    `${BASE_URL}/valuation/predict`,
    JSON.stringify({
      location: 'Downtown', sqft: 1200, bedrooms: 2, bathrooms: 2,
      age: 5, condition: 'Good', amenities: ['pool'], listingPrice: 500000
    }),
    { headers: JSON_HEADERS }
  );
  valuationDur.add(Date.now() - valStart);
  check(valRes, {
    'POST /valuation/predict status 200': (r) => r.status === 200,
    'POST /valuation/predict has estimatedValue': (r) => r.json('valuation.estimatedValue') > 0,
    'POST /valuation/predict has recommendation': (r) => !!r.json('recommendation.action'),
    'POST /valuation/predict response time < 3s': (r) => r.timings.duration < 3000,
  }) || errorRate.add(1);

  sleep(0.5);

  // 6. GET Bookings
  const bookingsRes = http.get(`${BASE_URL}/bookings`);
  check(bookingsRes, {
    'GET /bookings status 200': (r) => r.status === 200,
    'GET /bookings returns array': (r) => Array.isArray(r.json()),
  }) || errorRate.add(1);

  sleep(1);
}

export function handleSummary(data) {
  return {
    'reports/baseline-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, opts) {
  return `
PropAI Baseline Load Test Summary
===================================
VUs: 100 | Duration: 1m
-----------------------------------
Total Requests:    ${data.metrics.http_reqs?.values?.count || 0}
Failed Requests:   ${data.metrics.http_req_failed?.values?.passes || 0}
Avg Response Time: ${Math.round(data.metrics.http_req_duration?.values?.avg || 0)}ms
P95 Response Time: ${Math.round(data.metrics.http_req_duration?.values?.['p(95)'] || 0)}ms
P99 Response Time: ${Math.round(data.metrics.http_req_duration?.values?.['p(99)'] || 0)}ms
Checks Passed:     ${Math.round((data.metrics.checks?.values?.rate || 0) * 100)}%
===================================
`;
}
