require('dotenv').config();

module.exports = {
  baseUrl: process.env.BASE_URL || 'http://localhost:5173',
  browser: process.env.BROWSER || 'chrome',
  headless: process.env.HEADLESS !== 'false',
  timeouts: {
    implicit: parseInt(process.env.IMPLICIT_WAIT) || 10000,
    explicit: parseInt(process.env.EXPLICIT_WAIT) || 30000,
    pageLoad: 60000,
    script: 30000
  },
  testData: {
    buyerEmail: process.env.TEST_BUYER_EMAIL || 'buyer@propai.com',
    buyerPassword: process.env.TEST_BUYER_PASSWORD || 'password',
    sellerEmail: process.env.TEST_SELLER_EMAIL || 'seller@propai.com',
    sellerPassword: process.env.TEST_SELLER_PASSWORD || 'password',
    adminEmail: process.env.TEST_ADMIN_EMAIL || 'admin@propai.com',
    adminPassword: process.env.TEST_ADMIN_PASSWORD || 'password'
  },
  reporting: {
    screenshotsDir: './reports/screenshots',
    failuresDir: './reports/failures',
    logsDir: './reports/logs',
    excelDir: './reports/excel',
    htmlDir: './reports/mochawesome'
  }
};
