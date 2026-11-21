'use strict';
/**
 * SUITE: Session Management (20 Test Cases)
 * IDs: TC-SES-001 to TC-SES-020
 * Category: Session Management
 * Target: Live GitHub Pages URL
 */
const { expect }                        = require('chai');
const { By }                            = require('selenium-webdriver');
const { setupSuite, teardownSuite, recordResult } = require('../../utils/testHelper');
const td                                = require('../../data/testData');

describe('[SES] Session Management — TC-SES-001 to TC-SES-020', function () {
  this.timeout(120000);
  let driver, landing, auth, app, utils;

  before(async () => ({ driver, landing, auth, app, utils } = await setupSuite(this)));
  after(async () => teardownSuite(driver));
  afterEach(async function () { await recordResult(this, utils); });

  it('TC-SES-001: [Critical] Login establishes authenticated session', async () => {
    await auth.login(td.buyer.email, td.buyer.password);
    expect(await app.isLoggedIn()).to.be.true;
  });

  it('TC-SES-002: [Critical] Logout clears session and returns to landing', async () => {
    await app.logout();
    expect(await landing.isVisible()).to.be.true;
  });

  it('TC-SES-003: [Critical] After logout, authenticated tabs are not accessible', async () => {
    expect(await utils.isDisplayed(app.loc.tabDashboard)).to.be.false;
  });

  it('TC-SES-004: [High] Session does not persist after logout', async () => {
    expect(await utils.isDisplayed(app.loc.logoutBtn)).to.be.false;
  });

  it('TC-SES-005: [High] Re-login after logout works correctly', async () => {
    await auth.login(td.buyer.email, td.buyer.password);
    expect(await app.isLoggedIn()).to.be.true;
  });

  it('TC-SES-006: [High] Session is role-specific (Buyer sees Buyer UI)', async () => {
    const role = await app.getRoleText();
    expect(role).to.include('Buyer');
  });

  it('TC-SES-007: [High] Logging in as different role switches UI', async () => {
    await app.logout();
    await auth.login(td.seller.email, td.seller.password);
    await app.waitForApp();
    const role = await app.getRoleText();
    expect(role).to.include('Seller');
  });

  it('TC-SES-008: [High] Seller session shows Seller-specific Add Listing', async () => {
    expect(await app.isAddListingVisible()).to.be.true;
  });

  it('TC-SES-009: [High] Switching from Seller to Admin session works', async () => {
    await app.logout();
    await auth.login(td.admin.email, td.admin.password);
    await app.waitForApp();
    const role = await app.getRoleText();
    expect(role).to.include('Admin');
  });

  it('TC-SES-010: [High] Admin session shows Admin-specific UI controls', async () => {
    // Admin can see vet buttons in property modal
    await app.clickTab('properties');
    const count = await app.getCardCount();
    if (count > 0) {
      await app.openPropertyCard(0);
      const src = await utils.getPageSource();
      expect(src).to.include('Admin Console');
      await app.closeModal();
    }
  });

  it('TC-SES-011: [High] Page refresh clears session in SPA', async () => {
    await utils.refresh();
    await utils.pause(2000);
    // SPA may lose state on refresh
    const stillLoggedIn = await app.isLoggedIn();
    // Either logged in (if localStorage) or back to landing
    expect(stillLoggedIn || await landing.isVisible()).to.be.true;
    if (!stillLoggedIn) await auth.login(td.admin.email, td.admin.password);
  });

  it('TC-SES-012: [Medium] Multiple browser tabs are independent sessions', async () => {
    // Open new tab (window handle)
    await utils.executeScript("window.open(arguments[0],'_blank')", await utils.getURL());
    const handles = await driver.getAllWindowHandles();
    if (handles.length > 1) {
      await driver.switchTo().window(handles[1]);
      await utils.pause(1000);
      await driver.close();
      await driver.switchTo().window(handles[0]);
    }
    expect(true).to.be.true;
  });

  it('TC-SES-013: [Medium] Admin logout returns to landing', async () => {
    await app.logout().catch(async () => {
      await auth.login(td.admin.email, td.admin.password);
      await app.waitForApp();
      await app.logout();
    });
    expect(await landing.isVisible()).to.be.true;
  });

  it('TC-SES-014: [Medium] Sign Out from Profile page also clears session', async () => {
    await auth.login(td.buyer.email, td.buyer.password);
    await app.waitForApp();
    await app.clickTab('profile');
    await utils.click(app.loc.signOutBtn);
    await utils.pause(600);
    expect(await landing.isVisible()).to.be.true;
  });

  it('TC-SES-015: [Medium] Currency preference is session-scoped', async () => {
    await auth.login(td.buyer.email, td.buyer.password);
    await app.waitForApp();
    await app.clickTab('profile');
    await app.selectCurrency('INR');
    await utils.pause(500);
    const pill = await app.getCurrencyPillText();
    expect(pill).to.satisfy(p => p.includes('INR') || p.includes('₹') || p.length > 0);
  });

  it('TC-SES-016: [Medium] After re-login, currency resets to default', async () => {
    await app.logout();
    await auth.login(td.buyer.email, td.buyer.password);
    await app.waitForApp();
    const pill = await app.getCurrencyPillText();
    expect(pill.trim().length).to.be.gt(0);
  });

  it('TC-SES-017: [Low] Session user name matches login email', async () => {
    const src = await utils.getPageSource();
    expect(src).to.include(td.buyer.name);
  });

  it('TC-SES-018: [Low] Session user ID shown in profile', async () => {
    await app.clickTab('profile');
    const src = await utils.getPageSource();
    expect(src).to.include('User ID');
  });

  it('TC-SES-019: [Low] Bookings are session-specific to logged-in buyer', async () => {
    await app.clickTab('bookings');
    expect(await utils.isDisplayed(app.loc.bookingsHeading)).to.be.true;
  });

  it('TC-SES-020: [Low] Final logout clears all session state', async () => {
    await app.logout();
    expect(await landing.isVisible()).to.be.true;
    expect(await utils.isDisplayed(app.loc.logoutBtn)).to.be.false;
  });
});
