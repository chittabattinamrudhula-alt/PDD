import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, BUYER_EMAIL, BUYER_PASSWORD } from './config.js';

export const JSON_HEADERS = { 'Content-Type': 'application/json' };

export function login(email = BUYER_EMAIL, password = BUYER_PASSWORD) {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: JSON_HEADERS }
  );
  check(res, { 'login 200': (r) => r.status === 200 });
  return res.status === 200 ? res.json() : null;
}

export function authHeaders(token) {
  return { ...JSON_HEADERS, Authorization: `Bearer ${token || ''}` };
}

export function randomEmail() {
  return `loadtest_${Math.random().toString(36).substring(2, 9)}@propai.com`;
}

export function randomProperty() {
  const locations = ['Downtown', 'Beachfront', 'Uptown', 'Suburbs', 'Rural'];
  const conditions = ['Excellent', 'Good', 'Fair', 'Needs Work'];
  return {
    title: `Load Test Property ${Math.floor(Math.random() * 10000)}`,
    description: 'Automated load test listing',
    location: locations[Math.floor(Math.random() * locations.length)],
    sqft: 800 + Math.floor(Math.random() * 3000),
    bedrooms: 1 + Math.floor(Math.random() * 5),
    bathrooms: 1 + Math.floor(Math.random() * 3),
    age: Math.floor(Math.random() * 30),
    condition: conditions[Math.floor(Math.random() * conditions.length)],
    amenities: Math.random() > 0.5 ? ['pool', 'gym'] : ['garden'],
    listingPrice: 200000 + Math.floor(Math.random() * 1000000),
    titleVerified: Math.random() > 0.3,
    ownerName: 'Load Test Seller',
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80'
  };
}
