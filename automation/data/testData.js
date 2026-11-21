'use strict';
const config = require('../config/config');

const ts = () => Date.now();

module.exports = {
  // ── Seed accounts ─────────────────────────────────────────────────────────
  buyer:  { email: config.testData.buyerEmail,  password: config.testData.buyerPassword,  name: 'Bob Buyer',   role: 'Buyer'  },
  seller: { email: config.testData.sellerEmail, password: config.testData.sellerPassword, name: 'Sam Seller',  role: 'Seller' },
  admin:  { email: config.testData.adminEmail,  password: config.testData.adminPassword,  name: 'Alice Admin', role: 'Admin'  },

  // ── New user factory ───────────────────────────────────────────────────────
  newBuyer:  () => ({ name: `Auto Buyer ${ts()}`,  email: `buyer_${ts()}@autotest.com`,  phone: '+1 555-100-0001', password: 'Test@1234', role: 'Buyer'  }),
  newSeller: () => ({ name: `Auto Seller ${ts()}`, email: `seller_${ts()}@autotest.com`, phone: '+1 555-200-0002', password: 'Test@1234', role: 'Seller' }),

  // ── Invalid credentials ───────────────────────────────────────────────────
  invalid: {
    email:    'nobody@nowhere.xyz',
    password: 'wrongpassword',
    malformedEmail: 'notanemail',
    sqlInject:      "' OR 1=1 --",
    xssPayload:     '<script>alert(1)</script>',
    longString:     'A'.repeat(500),
    emptyString:    '',
    whitespace:     '   ',
    specialChars:   '!@#$%^&*()',
    unicodeEmail:   'tëst@example.com',
    noTLD:          'user@nodomain',
    doubleAt:       'user@@domain.com',
  },

  // ── Property data factory ─────────────────────────────────────────────────
  property: () => ({
    title:       `Test Villa ${ts()}`,
    description: 'Automated test property — Selenium E2E Suite.',
    location:    'Suburbs',
    sqft:        1800,
    bedrooms:    3,
    bathrooms:   2,
    age:         5,
    condition:   'Good',
    price:       450000,
  }),

  locations: ['Downtown', 'Beachfront', 'Uptown', 'Suburbs', 'Rural'],
  conditions: ['Excellent', 'Good', 'Fair', 'Needs Work'],
  amenities:  ['Pool', 'Gym', 'Garden', 'Smart_Home', 'Garage'],

  currencies: [
    { code: 'USD', symbol: '$' },
    { code: 'EUR', symbol: '€' },
    { code: 'GBP', symbol: '£' },
    { code: 'INR', symbol: '₹' },
    { code: 'JPY', symbol: '¥' },
    { code: 'AUD', symbol: 'A$' },
    { code: 'CAD', symbol: 'C$' },
    { code: 'CHF', symbol: 'Fr' },
    { code: 'CNY', symbol: '¥' },
    { code: 'AED', symbol: 'د.إ' },
  ],

  // ── Viewport sizes ────────────────────────────────────────────────────────
  viewports: [
    { width: 1920, height: 1080, label: 'Full HD Desktop' },
    { width: 1366, height: 768,  label: 'HD Laptop' },
    { width: 1024, height: 768,  label: 'Tablet Landscape' },
    { width: 768,  height: 1024, label: 'Tablet Portrait' },
    { width: 480,  height: 854,  label: 'Mobile Large' },
    { width: 375,  height: 667,  label: 'iPhone SE' },
    { width: 360,  height: 800,  label: 'Android' },
  ],

  // ── Expected UI text ──────────────────────────────────────────────────────
  text: {
    heroTagline:   'Secure Real Estate Appraisals',
    loginHeading:  'Welcome Back',
    signupHeading: 'Create Vetted Profile',
    dashTitle:     'Dashboard',
    propExplorer:  'Property Register Explorer',
    valTitle:      'AI-Powered Property Valuation',
    ledgerTitle:   'Title Registry Blockchain Ledger',
    buyerBookings: 'My Property Bookings',
    sellerBookings:'Sales Reservations',
    adminBookings: 'Global Reservation Registry',
    profileTitle:  'My Profile',
    addListingTitle:'Publish Vetted Deed Listing',
    auditTitle:    'Audit Vetting Dashboard',
  },

  // ── Performance thresholds (ms) ───────────────────────────────────────────
  thresholds: {
    pageLoad:     8000,
    apiResponse:  5000,
    interaction:  2000,
    totalSuite:   120000,
  },
};
