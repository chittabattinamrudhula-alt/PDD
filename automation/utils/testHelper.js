'use strict';
const DriverFactory  = require('./driverFactory');
const ExcelReporter  = require('./excelReporter');
const logger         = require('./logger');

/**
 * Standard before/after/afterEach hooks shared by every spec file.
 * Usage in a spec:
 *   const { setupSuite, teardownSuite, recordResult } = require('../utils/testHelper');
 *   before(async function() { ({ driver, landing, auth, app } = await setupSuite(this)); });
 *   after(async function()  { await teardownSuite(driver); });
 *   afterEach(async function() { await recordResult(this, utils); });
 */

const LandingPage = require('../pages/LandingPage');
const AuthPage    = require('../pages/AuthPage');
const AppPage     = require('../pages/AppPage');
const WebUtils    = require('./webUtils');
const config      = require('../config/config');

async function setupSuite(ctx) {
  const driver  = await DriverFactory.createDriver();
  const landing = new LandingPage(driver);
  const auth    = new AuthPage(driver);
  const app     = new AppPage(driver);
  const utils   = app.w;
  await landing.open();
  logger.info(`Suite started — target: ${config.baseUrl}`);
  return { driver, landing, auth, app, utils };
}

async function teardownSuite(driver) {
  await ExcelReporter.generateReport(config.environment, config.browser);
  await DriverFactory.quitDriver();
}

async function recordResult(ctx, utils) {
  const test   = ctx.currentTest;
  const status = test.state === 'passed'  ? 'PASSED'
               : test.state === 'failed'  ? 'FAILED'
               : 'SKIPPED';

  const entry = {
    module:    test.parent?.title || 'Unknown',
    scenario:  test.title,
    status,
    duration:  test.duration || 0,
    startTime: new Date(Date.now() - (test.duration || 0)).toISOString(),
    endTime:   new Date().toISOString(),
    url:       '',
    error:     null,
    screenshotPath: null,
  };

  if (status === 'FAILED' && utils) {
    entry.error          = test.err?.message || '';
    entry.screenshotPath = await utils.captureOnFailure(test.title, test.err).catch(() => null);
    entry.url            = await utils.getURL().catch(() => '');
  }

  ExcelReporter.addResult(entry);
  logger.testResult(
    test.title.split(':')[0]?.trim(),
    test.title,
    test.parent?.title,
    status,
    test.duration || 0,
    test.err?.message
  );
}

module.exports = { setupSuite, teardownSuite, recordResult };
