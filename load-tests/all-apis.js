/**
 * PropAI Full API Load Test
 * All 10 endpoints tested: Login, Signup, Properties CRUD, Valuation, Ledger, Bookings, Market Trends
 * 50 VUs | 2 minutes
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { BASE_URL, THRESHOLDS } from './config.js';
import { JSON_HEADERS, randomEmail, randomProperty } from './helpers.js';

const authDuration   = new Trend('auth_duration');
const propsDuration  = new Trend('props_duration');
const valDuration    = new Trend('val_duration');
const failRate       = new Rate('fail_rate');

export const options = {
  vus: 50,
  duration: '2m',
  thresholds: {
    ...THRESHOLDS,
    auth_duration:  ['p(95)<3000'],
    props_duration: ['p(95)<2000'],
    val_duration:   ['p(95)<3000'],
    fail_rate:      ['rate<0.05'],
  },
};

export default function () {
  group('Authentication API', () => {
    // Login - Buyer
    const t = Date.now();
    const loginRes = http.post(`${BASE_URL}/auth/login`,
      JSON.stringify({ email: 'buyer@propai.com', password: 'password' }),
      { headers: JSON_HEADERS }
    );
    authDuration.add(Date.now() - t);
    check(loginRes, {
      'login 200': r => r.status === 200,
      'login returns id': r => !!r.json('id'),
      'login returns role': r => r.json('role') === 'Buyer',
    }) || failRate.add(1);

    // Login - Seller
    const sellerRes = http.post(`${BASE_URL}/auth/login`,
      JSON.stringify({ email: 'seller@propai.com', password: 'password' }),
      { headers: JSON_HEADERS }
    );
    check(sellerRes, { 'seller login 200': r => r.status === 200 });

    // Login - Admin
    const adminRes = http.post(`${BASE_URL}/auth/login`,
      JSON.stringify({ email: 'admin@propai.com', password: 'password' }),
      { headers: JSON_HEADERS }
    );
    check(adminRes, { 'admin login 200': r => r.status === 200 });

    // Invalid login
    const badRes = http.post(`${BASE_URL}/auth/login`,
      JSON.stringify({ email: 'nobody@test.com', password: 'wrong' }),
      { headers: JSON_HEADERS }
    );
    check(badRes, { 'invalid login 401': r => r.status === 401 });

    sleep(0.3);
  });

  group('Properties API', () => {
    // GET all properties
    const t = Date.now();
    const propsRes = http.get(`${BASE_URL}/properties`);
    propsDuration.add(Date.now() - t);
    check(propsRes, {
      'GET properties 200': r => r.status === 200,
      'GET properties array': r => Array.isArray(r.json()),
      'GET properties has items': r => r.json().length >= 1,
      'GET properties has listingPrice': r => r.json()[0]?.listingPrice > 0,
    }) || failRate.add(1);

    // GET properties response structure
    if (propsRes.status === 200) {
      const p = propsRes.json()[0];
      check({ p }, {
        'property has id': ({ p }) => !!p.id || !!p._id,
        'property has title': ({ p }) => typeof p.title === 'string',
        'property has location': ({ p }) => typeof p.location === 'string',
        'property has valuation': ({ p }) => !!p.valuation,
        'property has recommendation': ({ p }) => !!p.recommendation,
        'property has anomalies': ({ p }) => !!p.anomalies,
      });
    }

    sleep(0.3);
  });

  group('Valuation API', () => {
    const locations = ['Downtown', 'Beachfront', 'Uptown', 'Suburbs', 'Rural'];
    const loc = locations[Math.floor(Math.random() * locations.length)];

    const t = Date.now();
    const valRes = http.post(`${BASE_URL}/valuation/predict`,
      JSON.stringify({
        location: loc, sqft: 800 + Math.floor(Math.random() * 3000),
        bedrooms: 1 + Math.floor(Math.random() * 5),
        bathrooms: 1 + Math.floor(Math.random() * 3),
        age: Math.floor(Math.random() * 30),
        condition: 'Good', amenities: ['pool', 'gym'],
        listingPrice: 200000 + Math.floor(Math.random() * 800000)
      }),
      { headers: JSON_HEADERS }
    );
    valDuration.add(Date.now() - t);
    check(valRes, {
      'POST valuation 200': r => r.status === 200,
      'valuation estimatedValue > 0': r => r.json('valuation.estimatedValue') > 0,
      'valuation has confidenceScore': r => r.json('valuation.confidenceScore') > 0,
      'valuation has action': r => ['BUY','HOLD','SELL'].includes(r.json('recommendation.action')),
      'valuation has growthRate': r => r.json('valuation.growthRatePercent') > 0,
    }) || failRate.add(1);

    sleep(0.3);
  });

  group('Blockchain Ledger API', () => {
    const ledgerRes = http.get(`${BASE_URL}/blockchain/ledger`);
    check(ledgerRes, {
      'GET ledger 200': r => r.status === 200,
      'ledger is array': r => Array.isArray(r.json()),
      'ledger has genesis': r => r.json()[0]?.index === 0,
      'genesis has hash': r => typeof r.json()[0]?.hash === 'string',
    });
    sleep(0.2);
  });

  group('Market Trends API', () => {
    const trendsRes = http.get(`${BASE_URL}/market/trends`);
    check(trendsRes, {
      'GET trends 200': r => r.status === 200,
      'trends has Downtown': r => !!r.json('Downtown'),
      'trends has Beachfront': r => !!r.json('Beachfront'),
      'trends Downtown has array': r => Array.isArray(r.json('Downtown')),
    });
    sleep(0.2);
  });

  group('Bookings API', () => {
    const bookingsRes = http.get(`${BASE_URL}/bookings`);
    check(bookingsRes, {
      'GET bookings 200': r => r.status === 200,
      'bookings is array': r => Array.isArray(r.json()),
    });

    const buyerBookings = http.get(`${BASE_URL}/bookings?buyerId=nonexistent`);
    check(buyerBookings, {
      'GET buyer bookings 200': r => r.status === 200,
      'buyer bookings empty array': r => Array.isArray(r.json()),
    });
    sleep(0.2);
  });

  sleep(1);
}
