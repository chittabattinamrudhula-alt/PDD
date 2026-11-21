'use strict';
require('dotenv').config();

const BASE_URL = process.env.BASE_URL;

// Hard-block localhost/preview URLs in CI
if (process.env.CI && BASE_URL && (
  BASE_URL.includes('localhost') ||
  BASE_URL.includes('127.0.0.1') ||
  BASE_URL.includes('preview')
)) {
  console.error('❌ FORBIDDEN: Selenium must only run against the live GitHub Pages URL in CI.');
  console.error(`   Got: ${BASE_URL}`);
  process.exit(1);
}

module.exports = {
  baseUrl: BASE_URL || 'https://chittabattinamrudhula-alt.github.io/PDD',
  browser:  process.env.BROWSER   || 'chrome',
  headless: process.env.HEADLESS  !== 'false',
  environment: process.env.ENVIRONMENT || 'github-pages',

  timeouts: {
    implicit:   parseInt(process.env.IMPLICIT_WAIT) || 15000,
    explicit:   parseInt(process.env.EXPLICIT_WAIT) || 45000,
    pageLoad:   90000,
    script:     30000,
    deployment: 300000  // 5 min max wait for GH Pages
  },

  testData: {
    buyerEmail:     process.env.TEST_BUYER_EMAIL    || 'buyer@propai.com',
    buyerPassword:  process.env.TEST_BUYER_PASSWORD || 'password',
    sellerEmail:    process.env.TEST_SELLER_EMAIL   || 'seller@propai.com',
    sellerPassword: process.env.TEST_SELLER_PASSWORD|| 'password',
    adminEmail:     process.env.TEST_ADMIN_EMAIL    || 'admin@propai.com',
    adminPassword:  process.env.TEST_ADMIN_PASSWORD || 'password',
    newUserPrefix:  'autotest',
    testProperty: {
      title:       'Automation Test Villa',
      description: 'Created by Selenium E2E automation framework for testing.',
      location:    'Suburbs',
      sqft:        2000,
      bedrooms:    3,
      bathrooms:   2,
      age:         5,
      condition:   'Good',
      price:       450000
    }
  },

  reporting: {
    screenshotsDir: './reports/screenshots',
    failuresDir:    './reports/failures',
    logsDir:        './reports/logs',
    excelDir:       './reports/excel',
    htmlDir:        './reports/html',
    jsonDir:        './reports/json',
    summaryDir:     './reports/summary',
    mochawesomeDir: './reports/mochawesome'
  },

  github: {
    runNumber: process.env.GITHUB_RUN_NUMBER || 'local',
    sha:       process.env.GITHUB_SHA        || 'local',
    repo:      process.env.GITHUB_REPO       || 'chittabattinamrudhula-alt/PDD',
    actor:     process.env.GITHUB_ACTOR      || 'local'
  },

  // Test categories and their expected test counts
  suites: {
    auth:          { label: 'Authentication',     count: 40,  idPrefix: 'TC-AUTH' },
    navigation:    { label: 'Navigation',         count: 30,  idPrefix: 'TC-NAV'  },
    ui:            { label: 'UI Validation',      count: 50,  idPrefix: 'TC-UI'   },
    forms:         { label: 'Forms',              count: 50,  idPrefix: 'TC-FORM' },
    crud:          { label: 'CRUD Operations',    count: 50,  idPrefix: 'TC-CRUD' },
    validation:    { label: 'Input Validation',   count: 40,  idPrefix: 'TC-VAL'  },
    error:         { label: 'Error Handling',     count: 20,  idPrefix: 'TC-ERR'  },
    session:       { label: 'Session Management', count: 20,  idPrefix: 'TC-SES'  },
    upload:        { label: 'File Upload',        count: 20,  idPrefix: 'TC-UPL'  },
    accessibility: { label: 'Accessibility',      count: 20,  idPrefix: 'TC-ACC'  },
    responsive:    { label: 'Responsive Design',  count: 20,  idPrefix: 'TC-RES'  },
    performance:   { label: 'Performance Smoke',  count: 20,  idPrefix: 'TC-PERF' },
    regression:    { label: 'Regression',         count: 50,  idPrefix: 'TC-REG'  }
  }
};
