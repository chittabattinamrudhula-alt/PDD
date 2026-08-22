/**
 * PropAI Soak Test - Sustained load for 30 minutes
 * 50 VUs | 30 minutes - Check for memory leaks, degradation
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';
import { BASE_URL, THRESHOLDS } from './config.js';
import { JSON_HEADERS } from './helpers.js';

const responseOverTime = new Trend('response_over_time');

export const options = {
  vus: 50,
  duration: '30m',
  thresholds: {
    http_req_duration:  ['p(95)<3000'],
    http_req_failed:    ['rate<0.05'],
    response_over_time: ['p(95)<3000'],
  },
};

export default function () {
  // Cycle through all API endpoints
  const endpoints = [
    { method: 'GET',  url: `${BASE_URL}/properties`,     body: null },
    { method: 'GET',  url: `${BASE_URL}/blockchain/ledger`, body: null },
    { method: 'GET',  url: `${BASE_URL}/market/trends`,   body: null },
    { method: 'GET',  url: `${BASE_URL}/bookings`,         body: null },
    {
      method: 'POST', url: `${BASE_URL}/auth/login`,
      body: JSON.stringify({ email: 'buyer@propai.com', password: 'password' })
    },
    {
      method: 'POST', url: `${BASE_URL}/valuation/predict`,
      body: JSON.stringify({ location: 'Downtown', sqft: 1000, bedrooms: 2, bathrooms: 1, age: 5, condition: 'Good', amenities: [], listingPrice: 400000 })
    },
  ];

  for (const ep of endpoints) {
    const opts = ep.body ? { headers: JSON_HEADERS } : {};
    const res = ep.method === 'POST'
      ? http.post(ep.url, ep.body, opts)
      : http.get(ep.url, opts);

    responseOverTime.add(res.timings.duration);

    check(res, {
      [`soak ${ep.url} ok`]: (r) => r.status < 500,
      [`soak ${ep.url} fast`]: (r) => r.timings.duration < 5000,
    });

    sleep(0.2);
  }
  sleep(2);
}
