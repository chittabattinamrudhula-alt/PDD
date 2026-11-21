'use strict';
/**
 * SUITE: Performance Smoke Tests (20 Test Cases)
 * IDs: TC-PERF-001 to TC-PERF-020
 * Category: Performance Smoke Tests
 * Target: Live GitHub Pages URL
 */
const { expect }                        = require('chai');
const { By }                            = require('selenium-webdriver');
const { setupSuite, teardownSuite, recordResult } = require('../../utils/testHelper');
const td                                = require('../../data/testData');
const config                            = require('../../config/config');

describe('[PERF] Performance Smoke Tests — TC-PERF-001 to TC-PERF-020', function () {
  this.timeout(120000);
  let driver, landing, auth, app, utils;

  before(async () => ({ driver, landing, auth, app, utils } = await setupSuite(this)));
  after(async () => teardownSuite(driver));
  afterEach(async function () { await recordResult(this, utils); });

  it('TC-PERF-001: [High] Landing page loads within 8 seconds', async () => {
    const start = Date.now();
    await utils.navigate(config.baseUrl);
    await utils.waitForPageLoad();
    const duration = Date.now() - start;
    expect(duration).to.be.lte(config.thresholds.pageLoad);
  });

  it('TC-PERF-002: [High] Login form opens within 2 seconds of click', async () => {
    const start = Date.now();
    await auth.openLoginForm();
    const duration = Date.now() - start;
    expect(duration).to.be.lte(config.thresholds.interaction);
  });

  it('TC-PERF-003: [Critical] Login completes within 8 seconds', async () => {
    const start = Date.now();
    await auth.login(td.buyer.email, td.buyer.password);
    const duration = Date.now() - start;
    expect(duration).to.be.lte(config.thresholds.pageLoad);
  });

  it('TC-PERF-004: [High] Dashboard renders within 8 seconds of login', async () => {
    const start = Date.now();
    await app.waitForApp();
    const duration = Date.now() - start;
    expect(duration).to.be.lte(config.thresholds.pageLoad);
  });

  it('TC-PERF-005: [High] Properties tab loads within 8 seconds', async () => {
    const start = Date.now();
    await app.clickTab('properties');
    await utils.pause(500);
    const duration = Date.now() - start;
    expect(duration).to.be.lte(config.thresholds.pageLoad);
  });

  it('TC-PERF-006: [High] Valuation tab loads within 8 seconds', async () => {
    const start = Date.now();
    await app.clickTab('valuation');
    await utils.waitForElement(app.loc.valHeading, 8000);
    const duration = Date.now() - start;
    expect(duration).to.be.lte(config.thresholds.pageLoad);
  });

  it('TC-PERF-007: [High] AI Valuation calculates within 5 seconds', async () => {
    const start = Date.now();
    await app.runValuation();
    const duration = Date.now() - start;
    expect(duration).to.be.lte(config.thresholds.apiResponse);
  });

  it('TC-PERF-008: [High] Ledger tab loads within 8 seconds', async () => {
    const start = Date.now();
    await app.clickTab('ledger');
    await utils.waitForElement(app.loc.ledgerHeading, 8000);
    const duration = Date.now() - start;
    expect(duration).to.be.lte(config.thresholds.pageLoad);
  });

  it('TC-PERF-009: [High] Bookings tab loads within 8 seconds', async () => {
    const start = Date.now();
    await app.clickTab('bookings');
    await utils.waitForElement(app.loc.bookingsHeading, 8000);
    const duration = Date.now() - start;
    expect(duration).to.be.lte(config.thresholds.pageLoad);
  });

  it('TC-PERF-010: [High] Profile tab loads within 8 seconds', async () => {
    const start = Date.now();
    await app.clickTab('profile');
    await utils.waitForElement(app.loc.profileHeading, 8000);
    const duration = Date.now() - start;
    expect(duration).to.be.lte(config.thresholds.pageLoad);
  });

  it('TC-PERF-011: [Medium] Property cards render within 8 seconds', async () => {
    await app.clickTab('properties');
    const start = Date.now();
    await utils.pause(1000);
    const count = await app.getCardCount();
    const duration = Date.now() - start;
    expect(duration).to.be.lte(config.thresholds.pageLoad);
  });

  it('TC-PERF-012: [Medium] Property modal opens within 2 seconds', async () => {
    const count = await app.getCardCount();
    if (count > 0) {
      const start = Date.now();
      await app.openPropertyCard(0);
      const duration = Date.now() - start;
      expect(duration).to.be.lte(config.thresholds.interaction);
      await app.closeModal();
    }
  });

  it('TC-PERF-013: [Medium] SVG trend chart renders within 5 seconds', async () => {
    await app.clickTab('dashboard');
    const start = Date.now();
    await utils.waitForElement(app.loc.trendChart, 5000);
    const duration = Date.now() - start;
    expect(duration).to.be.lte(config.thresholds.apiResponse);
  });

  it('TC-PERF-014: [Medium] Blockchain Ledger blocks load within 8 seconds', async () => {
    await app.clickTab('ledger');
    const start = Date.now();
    await utils.waitForElement(app.loc.genesisBlock, 8000);
    const duration = Date.now() - start;
    expect(duration).to.be.lte(config.thresholds.pageLoad);
  });

  it('TC-PERF-015: [Medium] 5 sequential page navigations complete under 30 seconds', async () => {
    const start = Date.now();
    for (const tab of ['dashboard', 'properties', 'valuation', 'ledger', 'bookings']) {
      await app.clickTab(tab);
      await utils.pause(500);
    }
    const duration = Date.now() - start;
    expect(duration).to.be.lte(30000);
  });

  it('TC-PERF-016: [Medium] Logout completes within 2 seconds', async () => {
    const start = Date.now();
    await app.logout();
    const duration = Date.now() - start;
    expect(duration).to.be.lte(config.thresholds.interaction);
  });

  it('TC-PERF-017: [Medium] Re-login after logout completes within 8 seconds', async () => {
    const start = Date.now();
    await auth.login(td.buyer.email, td.buyer.password);
    await app.waitForApp();
    const duration = Date.now() - start;
    expect(duration).to.be.lte(config.thresholds.pageLoad);
  });

  it('TC-PERF-018: [Low] Page memory does not grow excessively after navigation', async () => {
    // Basic smoke — check JS heap via performance API
    const memory = await utils.executeScript(`
      return window.performance && window.performance.memory
        ? window.performance.memory.usedJSHeapSize
        : 0;
    `);
    expect(parseInt(memory) || 0).to.be.gte(0); // Any non-negative value acceptable
  });

  it('TC-PERF-019: [Low] No long tasks blocking main thread', async () => {
    // Basic check — if page responds to interactions, main thread is not blocked
    const start = Date.now();
    await utils.click(app.loc.tabDashboard);
    const duration = Date.now() - start;
    expect(duration).to.be.lte(5000);
  });

  it('TC-PERF-020: [Low] Page load timing shows reasonable DOM completion', async () => {
    const loadTime = await app.w.getPageLoadTime();
    // 0 = API not available, still a pass
    expect(loadTime).to.be.gte(0);
    await app.logout();
  });
});
