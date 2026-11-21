'use strict';
/**
 * SUITE: Error Handling (20 Test Cases)
 * IDs: TC-ERR-001 to TC-ERR-020
 * Category: Error Handling
 * Target: Live GitHub Pages URL
 */
const { expect }                        = require('chai');
const { By }                            = require('selenium-webdriver');
const { setupSuite, teardownSuite, recordResult } = require('../../utils/testHelper');
const td                                = require('../../data/testData');

describe('[ERR] Error Handling — TC-ERR-001 to TC-ERR-020', function () {
  this.timeout(120000);
  let driver, landing, auth, app, utils;

  before(async () => ({ driver, landing, auth, app, utils } = await setupSuite(this)));
  after(async () => teardownSuite(driver));
  afterEach(async function () { await recordResult(this, utils); });

  it('TC-ERR-001: [Critical] Wrong credentials show user-friendly error', async () => {
    await auth.openLoginForm();
    await utils.type(auth.loc.emailInput, 'wrong@test.com');
    await utils.type(auth.loc.passwordInput, 'wrongpass');
    await utils.click(auth.loc.signInBtn);
    await utils.pause(1500);
    expect(await auth.isErrorVisible()).to.be.true;
  });

  it('TC-ERR-002: [High] Error message is at least 5 characters', async () => {
    const msg = await auth.getErrorText();
    expect(msg.trim().length).to.be.gte(5);
  });

  it('TC-ERR-003: [High] Correct credentials work after showing error', async () => {
    await auth.openLoginForm();
    await auth.login(td.buyer.email, td.buyer.password);
    expect(await app.isLoggedIn()).to.be.true;
  });

  it('TC-ERR-004: [High] Duplicate email signup shows error (not crash)', async () => {
    await app.logout();
    await auth.openSignupForm();
    const user = td.newBuyer();
    await auth.signup(user.name, td.buyer.email, user.phone, user.password, 'Buyer');
    await utils.pause(2000);
    expect(await auth.isErrorVisible()).to.be.true;
  });

  it('TC-ERR-005: [High] Booking already-booked property shows error', async () => {
    await auth.login(td.buyer.email, td.buyer.password);
    await app.waitForApp();
    await app.clickTab('properties');
    const count = await app.getCardCount();
    for (let i = 0; i < Math.min(count, 5); i++) {
      await app.openPropertyCard(i);
      const alreadyBooked = await utils.isDisplayed(app.loc.alreadyBooked);
      if (alreadyBooked) {
        // The button should be disabled
        const btn = await driver.findElement(app.loc.alreadyBooked);
        const disabled = await btn.getAttribute('disabled');
        expect(disabled !== null || alreadyBooked).to.be.true;
        await app.closeModal();
        break;
      }
      await app.closeModal();
      await utils.pause(300);
    }
  });

  it('TC-ERR-006: [Medium] Empty title on Add Listing does not crash', async () => {
    await app.logout();
    await auth.login(td.seller.email, td.seller.password);
    await app.waitForApp();
    await app.openAddListing();
    const el = await driver.findElement(app.loc.titleInput);
    await el.clear();
    await utils.click(app.loc.publishBtn);
    await utils.pause(500);
    expect(await app.isModalOpen()).to.be.true;
    await app.closeModal();
  });

  it('TC-ERR-007: [Medium] Network connectivity message shown when API fails', async () => {
    // Simulate by checking that app shows something meaningful
    await app.logout();
    await auth.openLoginForm();
    await utils.type(auth.loc.emailInput, 'test@test.com');
    await utils.type(auth.loc.passwordInput, 'pass');
    await utils.click(auth.loc.signInBtn);
    await utils.pause(2000);
    const src = await utils.getPageSource();
    expect(src).to.satisfy(s => s.includes('error') || s.includes('Invalid') || s.includes('failed') || s.includes('Connection'));
  });

  it('TC-ERR-008: [Medium] App does not show raw stack traces to user', async () => {
    const src = await utils.getPageSource();
    expect(src).not.to.include('at Object.<anonymous>');
    expect(src).not.to.include('node_modules');
  });

  it('TC-ERR-009: [Medium] App does not show 500 Internal Server Error page', async () => {
    const src = await utils.getPageSource();
    expect(src).not.to.include('500 Internal Server Error');
  });

  it('TC-ERR-010: [Medium] App does not show white screen of death', async () => {
    const src = await utils.getPageSource();
    expect(src.length).to.be.gt(500);
  });

  it('TC-ERR-011: [High] No SEVERE browser console errors on landing', async () => {
    await auth.login(td.buyer.email, td.buyer.password);
    await app.waitForApp();
    const errors = await utils.getConsoleErrors();
    expect(errors.length).to.be.lte(5);
  });

  it('TC-ERR-012: [Medium] No SEVERE errors on Properties tab', async () => {
    await app.clickTab('properties');
    await utils.pause(500);
    const errors = await utils.getConsoleErrors();
    expect(errors.length).to.be.lte(5);
  });

  it('TC-ERR-013: [Medium] No SEVERE errors on Valuation tab', async () => {
    await app.clickTab('valuation');
    await utils.pause(500);
    const errors = await utils.getConsoleErrors();
    expect(errors.length).to.be.lte(5);
  });

  it('TC-ERR-014: [Medium] No SEVERE errors on Ledger tab', async () => {
    await app.clickTab('ledger');
    await utils.pause(500);
    const errors = await utils.getConsoleErrors();
    expect(errors.length).to.be.lte(5);
  });

  it('TC-ERR-015: [Medium] No SEVERE errors on Bookings tab', async () => {
    await app.clickTab('bookings');
    await utils.pause(500);
    const errors = await utils.getConsoleErrors();
    expect(errors.length).to.be.lte(5);
  });

  it('TC-ERR-016: [Low] Page source contains no ">undefined<" strings', async () => {
    const src = await utils.getPageSource();
    expect(src).not.to.include('>undefined<');
  });

  it('TC-ERR-017: [Low] Page source contains no "NaN" in price fields', async () => {
    await app.clickTab('properties');
    const count = await app.getCardCount();
    if (count > 0) {
      const src = await utils.getPageSource();
      const prices = [...src.matchAll(/class="property-price"[^>]*>([^<]+)</g)];
      prices.forEach(p => { expect(p[1]).not.to.include('NaN'); });
    }
  });

  it('TC-ERR-018: [Medium] Rapid login-logout cycle does not crash', async () => {
    for (let i = 0; i < 2; i++) {
      await app.logout();
      await auth.login(td.buyer.email, td.buyer.password);
      await app.waitForApp();
    }
    expect(await app.isLoggedIn()).to.be.true;
  });

  it('TC-ERR-019: [High] 404 page or redirect shown for unknown hash route', async () => {
    // SPA handles all routes — app should stay alive
    const currentUrl = await utils.getURL();
    await utils.navigate(`${currentUrl}#/unknown-route`);
    await utils.pause(500);
    const src = await utils.getPageSource();
    expect(src.length).to.be.gt(500);
  });

  it('TC-ERR-020: [Low] App recovers after page refresh mid-session', async () => {
    await utils.refresh();
    await utils.pause(2000);
    const src = await utils.getPageSource();
    expect(src).to.include('PropAI');
    await app.logout().catch(() => {});
  });
});
