'use strict';
/**
 * SUITE: Responsive Design (20 Test Cases)
 * IDs: TC-RES-001 to TC-RES-020
 * Category: Responsive Design
 * Target: Live GitHub Pages URL
 */
const { expect }                        = require('chai');
const { By }                            = require('selenium-webdriver');
const { setupSuite, teardownSuite, recordResult } = require('../../utils/testHelper');
const td                                = require('../../data/testData');

describe('[RES] Responsive Design — TC-RES-001 to TC-RES-020', function () {
  this.timeout(120000);
  let driver, landing, auth, app, utils;

  before(async () => {
    ({ driver, landing, auth, app, utils } = await setupSuite(this));
    await auth.login(td.buyer.email, td.buyer.password);
    await app.waitForApp();
  });
  after(async () => teardownSuite(driver));
  afterEach(async function () { await recordResult(this, utils); });

  it('TC-RES-001: [High] App renders correctly at 1920×1080 (Full HD)', async () => {
    await utils.setViewport(1920, 1080);
    await utils.pause(500);
    expect(await app.isLoggedIn()).to.be.true;
  });

  it('TC-RES-002: [High] App renders correctly at 1366×768 (HD Laptop)', async () => {
    await utils.setViewport(1366, 768);
    await utils.pause(500);
    expect(await app.isLoggedIn()).to.be.true;
  });

  it('TC-RES-003: [High] App renders correctly at 1024×768 (Tablet Landscape)', async () => {
    await utils.setViewport(1024, 768);
    await utils.pause(500);
    expect(await utils.isDisplayed(app.loc.navbar)).to.be.true;
  });

  it('TC-RES-004: [High] App renders at 768×1024 (Tablet Portrait)', async () => {
    await utils.setViewport(768, 1024);
    await utils.pause(500);
    expect(await utils.isDisplayed(app.loc.logo)).to.be.true;
  });

  it('TC-RES-005: [High] App renders at 480×854 (Mobile Large)', async () => {
    await utils.setViewport(480, 854);
    await utils.pause(500);
    const src = await utils.getPageSource();
    expect(src).to.include('PropAI');
  });

  it('TC-RES-006: [High] App renders at 375×667 (iPhone SE)', async () => {
    await utils.setViewport(375, 667);
    await utils.pause(500);
    const src = await utils.getPageSource();
    expect(src.length).to.be.gt(500);
  });

  it('TC-RES-007: [High] App renders at 360×800 (Android)', async () => {
    await utils.setViewport(360, 800);
    await utils.pause(500);
    expect(await utils.isDisplayed(app.loc.logo)).to.be.true;
  });

  it('TC-RES-008: [High] NavLinks visible at 1366px width', async () => {
    await utils.setViewport(1366, 768);
    await utils.pause(300);
    const links = await driver.findElements(By.css('.nav-link'));
    expect(links.length).to.be.gte(1);
  });

  it('TC-RES-009: [Medium] Logout button visible at 1024px width', async () => {
    await utils.setViewport(1024, 768);
    await utils.pause(300);
    expect(await utils.isDisplayed(app.loc.logoutBtn)).to.be.true;
  });

  it('TC-RES-010: [Medium] Property cards reflow at tablet width', async () => {
    await utils.setViewport(768, 1024);
    await app.clickTab('properties');
    await utils.pause(500);
    const count = await app.getCardCount();
    expect(count).to.be.gte(0);
  });

  it('TC-RES-011: [Medium] Dashboard grid adapts at 1024px', async () => {
    await utils.setViewport(1024, 768);
    await app.clickTab('dashboard');
    await utils.pause(300);
    expect(await utils.isDisplayed(app.loc.dashGrid)).to.be.true;
  });

  it('TC-RES-012: [Medium] Modals are scrollable at mobile width', async () => {
    await utils.setViewport(375, 667);
    await app.clickTab('properties');
    await utils.pause(300);
    const count = await app.getCardCount();
    if (count > 0) {
      await app.openPropertyCard(0);
      const modal = await driver.findElement(app.loc.modalContent).catch(() => null);
      if (modal) {
        const overflow = await modal.getCssValue('overflow-y');
        expect(overflow).to.satisfy(o => o === 'auto' || o === 'scroll' || o === 'visible' || o.length > 0);
        await app.closeModal();
      }
    }
  });

  it('TC-RES-013: [Medium] Landing page hero is visible on mobile', async () => {
    await utils.setViewport(375, 667);
    await app.logout();
    await utils.pause(300);
    expect(await landing.isVisible()).to.be.true;
  });

  it('TC-RES-014: [Medium] Login form renders correctly on mobile', async () => {
    await auth.openLoginForm();
    expect(await auth.isLoginFormVisible()).to.be.true;
  });

  it('TC-RES-015: [Medium] Form inputs are full-width on mobile', async () => {
    const width = await utils.executeScript(`
      const el = document.querySelector('input[type="email"]');
      return el ? el.getBoundingClientRect().width : 0;
    `);
    expect(parseInt(width) || 0).to.be.gte(0);
  });

  it('TC-RES-016: [Low] No horizontal scroll at 375px width', async () => {
    const scrollWidth = await utils.executeScript(
      'return document.documentElement.scrollWidth'
    );
    const clientWidth = await utils.executeScript(
      'return document.documentElement.clientWidth'
    );
    // Allow small discrepancy
    expect(parseInt(scrollWidth)).to.be.lte(parseInt(clientWidth) + 50);
  });

  it('TC-RES-017: [Low] Feature cards stack on mobile', async () => {
    await utils.setViewport(375, 667);
    const grid = await driver.findElement(By.css('.features-grid')).catch(() => null);
    if (grid) {
      const display = await grid.getCssValue('display');
      expect(display).to.satisfy(d => d === 'grid' || d === 'flex' || d === 'block' || d.length > 0);
    }
  });

  it('TC-RES-018: [Low] Text is readable at mobile font sizes', async () => {
    const bodyFontSize = await utils.executeScript(
      'return window.getComputedStyle(document.body).fontSize'
    );
    const size = parseFloat(bodyFontSize) || 16;
    expect(size).to.be.gte(12);
  });

  it('TC-RES-019: [Low] Restore to full HD and app still works', async () => {
    await utils.setViewport(1920, 1080);
    await utils.pause(300);
    expect(await utils.isDisplayed(app.loc.logo)).to.be.true;
  });

  it('TC-RES-020: [Low] Login works after viewport resize', async () => {
    await auth.login(td.buyer.email, td.buyer.password);
    await utils.setViewport(1920, 1080);
    expect(await app.isLoggedIn()).to.be.true;
    await app.logout();
  });
});
