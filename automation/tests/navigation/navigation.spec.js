'use strict';
/**
 * SUITE: Navigation (30 Test Cases)
 * IDs: TC-NAV-001 to TC-NAV-030
 * Category: Navigation
 * Target: Live GitHub Pages URL
 */
const { expect }                        = require('chai');
const { By }                            = require('selenium-webdriver');
const { setupSuite, teardownSuite, recordResult } = require('../../utils/testHelper');
const td                                = require('../../data/testData');

describe('[NAV] Navigation — TC-NAV-001 to TC-NAV-030', function () {
  this.timeout(120000);
  let driver, landing, auth, app, utils;

  before(async () => {
    ({ driver, landing, auth, app, utils } = await setupSuite(this));
    await auth.login(td.buyer.email, td.buyer.password);
    await app.waitForApp();
  });
  after(async () => teardownSuite(driver));
  afterEach(async function () { await recordResult(this, utils); });

  it('TC-NAV-001: [High] Navbar is present and visible', async () => {
    expect(await utils.isDisplayed(app.loc.navbar)).to.be.true;
  });

  it('TC-NAV-002: [High] Dashboard tab is clickable and active', async () => {
    await app.clickTab('dashboard');
    expect(await utils.isDisplayed(app.loc.dashGrid)).to.be.true;
  });

  it('TC-NAV-003: [High] Properties tab navigates to explorer', async () => {
    await app.clickTab('properties');
    const src = await utils.getPageSource();
    expect(src).to.include('Property Register Explorer');
  });

  it('TC-NAV-004: [High] Valuation tab navigates to AI Valuation page', async () => {
    await app.clickTab('valuation');
    expect(await utils.isDisplayed(app.loc.valHeading)).to.be.true;
  });

  it('TC-NAV-005: [High] Ledger tab navigates to Blockchain Ledger', async () => {
    await app.clickTab('ledger');
    expect(await utils.isDisplayed(app.loc.ledgerHeading)).to.be.true;
  });

  it('TC-NAV-006: [High] Bookings tab navigates to My Bookings', async () => {
    await app.clickTab('bookings');
    expect(await utils.isDisplayed(app.loc.bookingsHeading)).to.be.true;
  });

  it('TC-NAV-007: [High] Profile tab navigates to Profile page', async () => {
    await app.clickTab('profile');
    expect(await utils.isDisplayed(app.loc.profileHeading)).to.be.true;
  });

  it('TC-NAV-008: [Medium] Active tab has "active" CSS class', async () => {
    await app.clickTab('dashboard');
    const activeEl = await driver.findElement(app.loc.activeTab).catch(() => null);
    expect(activeEl).to.not.be.null;
  });

  it('TC-NAV-009: [Medium] Clicking PropAI logo does not break navigation', async () => {
    await utils.click(app.loc.logo);
    await utils.pause(500);
    expect(await app.isLoggedIn()).to.be.true;
  });

  it('TC-NAV-010: [Medium] All 6 nav tabs are visible', async () => {
    const tabs = await driver.findElements(By.css('.nav-link'));
    expect(tabs.length).to.be.gte(6);
  });

  it('TC-NAV-011: [High] Dashboard tab returns from Properties', async () => {
    await app.clickTab('properties');
    await app.clickTab('dashboard');
    expect(await utils.isDisplayed(app.loc.dashGrid)).to.be.true;
  });

  it('TC-NAV-012: [High] Rapid tab switching does not crash the app', async () => {
    for (const tab of ['properties', 'valuation', 'ledger', 'bookings', 'dashboard']) {
      await app.clickTab(tab);
      await utils.pause(300);
    }
    expect(await app.isLoggedIn()).to.be.true;
  });

  it('TC-NAV-013: [Medium] Browser back button works within SPA', async () => {
    await app.clickTab('properties');
    await utils.goBack();
    await utils.pause(500);
    expect(await app.isLoggedIn()).to.be.true;
  });

  it('TC-NAV-014: [Medium] Page refresh retains app structure (may require re-login)', async () => {
    await utils.refresh();
    await utils.pause(1500);
    const src = await utils.getPageSource();
    expect(src).to.include('PropAI');
  });

  it('TC-NAV-015: [High] Logout button navigates to landing page', async () => {
    await app.logout();
    expect(await landing.isVisible()).to.be.true;
  });

  it('TC-NAV-016: [High] Logging back in after logout works', async () => {
    await auth.login(td.buyer.email, td.buyer.password);
    expect(await app.isLoggedIn()).to.be.true;
  });

  it('TC-NAV-017: [Medium] Launch AI Estimator button navigates to Valuation', async () => {
    await app.clickTab('dashboard');
    const btn = await utils.isDisplayed(app.loc.launchEstimator);
    if (btn) {
      await utils.click(app.loc.launchEstimator);
      await utils.pause(500);
      expect(await utils.isDisplayed(app.loc.valHeading)).to.be.true;
    }
  });

  it('TC-NAV-018: [Medium] Inspect Vetting button opens property modal', async () => {
    await app.clickTab('properties');
    const count = await app.getCardCount();
    if (count > 0) {
      await app.openPropertyCard(0);
      expect(await app.isModalOpen()).to.be.true;
      await app.closeModal();
    }
  });

  it('TC-NAV-019: [Medium] Modal close button returns to properties list', async () => {
    const count = await app.getCardCount();
    if (count > 0) {
      await app.openPropertyCard(0);
      await app.closeModal();
      expect(await app.isModalOpen()).to.be.false;
    }
  });

  it('TC-NAV-020: [Medium] Clicking modal overlay background closes modal', async () => {
    const count = await app.getCardCount();
    if (count > 0) {
      await app.openPropertyCard(0);
      await utils.executeScript("document.querySelector('.modal-overlay')?.click()");
      await utils.pause(500);
      expect(await app.isModalOpen()).to.be.false;
    }
  });

  it('TC-NAV-021: [High] Seller nav has Sales Ledger tab', async () => {
    await app.logout();
    await auth.login(td.seller.email, td.seller.password);
    await app.waitForApp();
    const src = await utils.getPageSource();
    expect(src).to.include('Sales Ledger');
  });

  it('TC-NAV-022: [High] Admin nav has Global Bookings tab', async () => {
    await app.logout();
    await auth.login(td.admin.email, td.admin.password);
    await app.waitForApp();
    const src = await utils.getPageSource();
    expect(src).to.include('Global Bookings');
  });

  it('TC-NAV-023: [Medium] Admin can navigate to all 6 tabs', async () => {
    for (const tab of ['dashboard', 'properties', 'valuation', 'ledger', 'bookings', 'profile']) {
      await app.clickTab(tab);
      await utils.pause(400);
    }
    expect(await app.isLoggedIn()).to.be.true;
    await app.logout();
  });

  it('TC-NAV-024: [Medium] Landing page "Register" button opens signup form', async () => {
    await landing.open();
    await landing.clickRegister();
    await utils.pause(400);
    const src = await utils.getPageSource();
    expect(src).to.include('Create Vetted Profile');
  });

  it('TC-NAV-025: [Medium] Navbar Login + Sign Up buttons visible when logged out', async () => {
    expect(await utils.isDisplayed(landing.loc.navLoginBtn)).to.be.true;
    expect(await utils.isDisplayed(landing.loc.navSignupBtn)).to.be.true;
  });

  it('TC-NAV-026: [Medium] Clicking Sign Up nav button opens signup form', async () => {
    await landing.clickNavSignUp();
    await utils.pause(300);
    const src = await utils.getPageSource();
    expect(src).to.include('Create Vetted Profile');
  });

  it('TC-NAV-027: [Medium] Navbar hides Login/Sign Up buttons when logged in', async () => {
    await auth.login(td.buyer.email, td.buyer.password);
    await app.waitForApp();
    expect(await utils.isDisplayed(landing.loc.navLoginBtn)).to.be.false;
  });

  it('TC-NAV-028: [Low] Scroll to bottom and back works without errors', async () => {
    await app.clickTab('dashboard');
    await utils.scrollToBottom();
    await utils.pause(300);
    await utils.scrollToTop();
    expect(await app.isLoggedIn()).to.be.true;
  });

  it('TC-NAV-029: [Low] Properties tab label is correct for Buyer', async () => {
    const src = await utils.getPageSource();
    expect(src).to.include('Properties');
  });

  it('TC-NAV-030: [Medium] Profile tab shows correct user name', async () => {
    await app.clickTab('profile');
    const src = await utils.getPageSource();
    expect(src).to.include(td.buyer.name);
    await app.logout();
  });
});
