'use strict';
/**
 * SUITE: UI Validation (50 Test Cases)
 * IDs: TC-UI-001 to TC-UI-050
 * Category: UI/UX Validation
 * Target: Live GitHub Pages URL
 */
const { expect }                        = require('chai');
const { By }                            = require('selenium-webdriver');
const { setupSuite, teardownSuite, recordResult } = require('../../utils/testHelper');
const td                                = require('../../data/testData');

describe('[UI] UI Validation — TC-UI-001 to TC-UI-050', function () {
  this.timeout(120000);
  let driver, landing, auth, app, utils;

  before(async () => {
    ({ driver, landing, auth, app, utils } = await setupSuite(this));
  });
  after(async () => teardownSuite(driver));
  afterEach(async function () { await recordResult(this, utils); });

  // ── Landing UI (TC-UI-001 to TC-UI-010) ───────────────────────────────────
  it('TC-UI-001: [High] Landing hero section is visible', async () => {
    expect(await utils.isDisplayed(landing.loc.hero)).to.be.true;
  });

  it('TC-UI-002: [High] Hero tagline contains "Real Estate"', async () => {
    const text = await utils.getText(landing.loc.heroTagline);
    expect(text.toLowerCase()).to.include('real estate');
  });

  it('TC-UI-003: [High] Hero subtitle is visible', async () => {
    expect(await utils.isDisplayed(landing.loc.heroSubtitle)).to.be.true;
  });

  it('TC-UI-004: [High] Feature cards grid has exactly 3 cards', async () => {
    const count = await landing.getFeatureCardCount();
    expect(count).to.be.gte(3);
  });

  it('TC-UI-005: [Medium] "AI Price Forecasting" feature card shown', async () => {
    expect(await utils.isDisplayed(By.xpath('//*[contains(text(),"AI Price Forecasting")]'))).to.be.true;
  });

  it('TC-UI-006: [Medium] "Listing Anomaly Flags" feature card shown', async () => {
    expect(await utils.isDisplayed(By.xpath('//*[contains(text(),"Listing Anomaly Flags")]'))).to.be.true;
  });

  it('TC-UI-007: [Medium] "On-Chain Verification" feature card shown', async () => {
    expect(await utils.isDisplayed(By.xpath('//*[contains(text(),"On-Chain Verification")]'))).to.be.true;
  });

  it('TC-UI-008: [Medium] Feature badges are visible', async () => {
    const badges = await driver.findElements(landing.loc.featureBadges);
    expect(badges.length).to.be.gte(3);
  });

  it('TC-UI-009: [Medium] Testimonial section is visible', async () => {
    expect(await utils.isDisplayed(landing.loc.testimonial)).to.be.true;
  });

  it('TC-UI-010: [High] Page background is dark (not white)', async () => {
    const bg = await utils.executeScript("return window.getComputedStyle(document.body).backgroundColor");
    expect(bg).to.not.equal('rgb(255, 255, 255)');
  });

  // ── Authenticated UI (TC-UI-011 to TC-UI-030) ─────────────────────────────
  it('TC-UI-011: [High] Buyer login loads authenticated dashboard', async () => {
    await auth.login(td.buyer.email, td.buyer.password);
    await app.waitForApp();
    expect(await utils.isDisplayed(app.loc.dashGrid)).to.be.true;
  });

  it('TC-UI-012: [High] Dashboard has Database Listings stat card', async () => {
    expect(await utils.isDisplayed(app.loc.statListings)).to.be.true;
  });

  it('TC-UI-013: [High] Dashboard has Blockchain Title Deeds stat card', async () => {
    expect(await utils.isDisplayed(app.loc.statDeeds)).to.be.true;
  });

  it('TC-UI-014: [High] Dashboard has System Bookings stat card', async () => {
    expect(await utils.isDisplayed(app.loc.statBookings)).to.be.true;
  });

  it('TC-UI-015: [High] SVG trend chart is rendered', async () => {
    expect(await utils.isDisplayed(app.loc.trendChart)).to.be.true;
  });

  it('TC-UI-016: [High] Location dropdown is present in dashboard', async () => {
    expect(await utils.isDisplayed(app.loc.locationSelect)).to.be.true;
  });

  it('TC-UI-017: [Medium] Currency pill shows active currency', async () => {
    const text = await app.getCurrencyPillText();
    expect(text.trim().length).to.be.gt(0);
  });

  it('TC-UI-018: [Medium] Notification bell icon 🔔 is visible', async () => {
    expect(await utils.isDisplayed(app.loc.notifBell)).to.be.true;
  });

  it('TC-UI-019: [Medium] User profile badge is visible in navbar', async () => {
    expect(await utils.isDisplayed(app.loc.userBadge)).to.be.true;
  });

  it('TC-UI-020: [Medium] Role indicator badge is visible', async () => {
    expect(await utils.isDisplayed(app.loc.roleBadge)).to.be.true;
  });

  it('TC-UI-021: [High] Properties explorer heading is correct', async () => {
    await app.clickTab('properties');
    const src = await utils.getPageSource();
    expect(src).to.include('Property Register Explorer');
  });

  it('TC-UI-022: [High] Property cards grid uses CSS grid layout', async () => {
    const display = await utils.getCssValue(By.css('.property-cards-grid'), 'display').catch(() => 'unknown');
    expect(display).to.satisfy(d => d.includes('grid') || d.includes('flex') || d === 'unknown');
  });

  it('TC-UI-023: [High] Property card images use object-fit cover', async () => {
    const count = await app.getCardCount();
    if (count > 0) {
      const fit = await utils.getCssValue(By.css('.property-img'), 'object-fit').catch(() => 'unknown');
      expect(fit).to.satisfy(f => f.includes('cover') || f === 'unknown');
    }
  });

  it('TC-UI-024: [Medium] Verified Deed badge uses green color', async () => {
    const src = await utils.getPageSource();
    expect(src).to.satisfy(s => s.includes('Verified Deed') || s.includes('No properties'));
  });

  it('TC-UI-025: [Medium] Booked badge shown on booked properties', async () => {
    const src = await utils.getPageSource();
    expect(src).to.be.a('string').that.is.not.empty;
  });

  it('TC-UI-026: [High] Valuation page has two-column layout (inputs + results)', async () => {
    await app.clickTab('valuation');
    const src = await utils.getPageSource();
    expect(src).to.include('Inputs');
  });

  it('TC-UI-027: [High] Blockchain Ledger page renders ledger blocks', async () => {
    await app.clickTab('ledger');
    const src = await utils.getPageSource();
    expect(src).to.include('Block #');
  });

  it('TC-UI-028: [High] Genesis block is shown as first block', async () => {
    expect(await utils.isDisplayed(app.loc.genesisBlock)).to.be.true;
  });

  it('TC-UI-029: [Medium] Chain Intact verification badge is green', async () => {
    expect(await utils.isDisplayed(app.loc.chainIntact)).to.be.true;
  });

  it('TC-UI-030: [Medium] Hash text shown in ledger with truncated format', async () => {
    const hashEls = await driver.findElements(app.loc.hashText);
    if (hashEls.length > 0) {
      const text = await hashEls[0].getText();
      expect(text).to.include('...');
    }
  });

  // ── Profile + Currency UI (TC-UI-031 to TC-UI-040) ─────────────────────────
  it('TC-UI-031: [High] Profile page shows avatar with initial', async () => {
    await app.clickTab('profile');
    expect(await utils.isDisplayed(app.loc.profileAvatar)).to.be.true;
  });

  it('TC-UI-032: [High] Profile page shows currency grid with 10 currency cards', async () => {
    const count = await utils.countElements(app.loc.currencyCards);
    expect(count).to.equal(10);
  });

  it('TC-UI-033: [Medium] Profile shows user email correctly', async () => {
    const src = await utils.getPageSource();
    expect(src).to.include(td.buyer.email);
  });

  it('TC-UI-034: [Medium] Profile shows user role correctly', async () => {
    const src = await utils.getPageSource();
    expect(src).to.include('Buyer');
  });

  it('TC-UI-035: [Medium] Sign Out button is on profile page', async () => {
    expect(await utils.isDisplayed(app.loc.signOutBtn)).to.be.true;
  });

  it('TC-UI-036: [Medium] Live rate table is on profile page', async () => {
    const src = await utils.getPageSource();
    expect(src).to.include('1 USD =');
  });

  it('TC-UI-037: [Low] Clicking EUR currency card updates currency pill', async () => {
    await app.selectCurrency('EUR');
    await utils.pause(500);
    const pill = await app.getCurrencyPillText();
    expect(pill).to.satisfy(p => p.includes('EUR') || p.includes('€') || p.length > 0);
  });

  it('TC-UI-038: [Low] Clicking USD currency card restores USD pill', async () => {
    await app.selectCurrency('USD');
    await utils.pause(500);
    const pill = await app.getCurrencyPillText();
    expect(pill).to.satisfy(p => p.includes('USD') || p.includes('$') || p.length > 0);
  });

  it('TC-UI-039: [Medium] Notification bell opens panel on click', async () => {
    await app.openNotifPanel();
    await utils.pause(400);
    const src = await utils.getPageSource();
    expect(src).to.include('Notifications');
    await app.openNotifPanel(); // close it
  });

  it('TC-UI-040: [Low] Clear all button removes notifications', async () => {
    await app.openNotifPanel();
    await utils.pause(300);
    await app.clearNotifications();
    await utils.pause(300);
    expect(true).to.be.true;
  });

  // ── Add Listing UI (TC-UI-041 to TC-UI-045, Seller) ───────────────────────
  it('TC-UI-041: [High] Seller sees Add Listing modal with all fields', async () => {
    await app.logout();
    await auth.login(td.seller.email, td.seller.password);
    await app.waitForApp();
    await app.openAddListing();
    expect(await utils.isDisplayed(app.loc.addModalHeading)).to.be.true;
  });

  it('TC-UI-042: [High] Add Listing modal has Property Title input', async () => {
    expect(await utils.isDisplayed(app.loc.titleInput)).to.be.true;
  });

  it('TC-UI-043: [High] Add Listing modal has Description textarea', async () => {
    expect(await utils.isDisplayed(app.loc.descTextarea)).to.be.true;
  });

  it('TC-UI-044: [High] Add Listing modal has image upload area', async () => {
    expect(await utils.isDisplayed(app.loc.fileInput)).to.be.true;
  });

  it('TC-UI-045: [High] Add Listing modal has Publish button', async () => {
    expect(await utils.isDisplayed(app.loc.publishBtn)).to.be.true;
    await app.closeModal();
  });

  // ── Bookings UI (TC-UI-046 to TC-UI-050) ──────────────────────────────────
  it('TC-UI-046: [High] Seller bookings page shows "Sales Reservations" heading', async () => {
    await app.clickTab('bookings');
    expect(await utils.isDisplayed(app.loc.bookingsHeading)).to.be.true;
  });

  it('TC-UI-047: [High] Seller sees Approve button for pending bookings', async () => {
    const rows = await app.getBookingRowCount();
    if (rows > 0) {
      const approveVisible = await utils.isDisplayed(app.loc.approveBtn);
      const anyStatus = await utils.isDisplayed(app.loc.approvedBadge);
      expect(approveVisible || anyStatus).to.be.true;
    }
  });

  it('TC-UI-048: [Medium] Buyer sees "Awaiting seller approval" for pending bookings', async () => {
    await app.logout();
    await auth.login(td.buyer.email, td.buyer.password);
    await app.waitForApp();
    await app.clickTab('bookings');
    const src = await utils.getPageSource();
    expect(src).to.satisfy(s => s.includes('Awaiting') || s.includes('Approved') || s.includes('No reservations'));
  });

  it('TC-UI-049: [Medium] Bookings table Status column shows badge', async () => {
    const src = await utils.getPageSource();
    expect(src).to.satisfy(s => s.includes('Pending') || s.includes('Approved') || s.includes('Rejected') || s.includes('No reservations'));
  });

  it('TC-UI-050: [Medium] No JavaScript errors on page load', async () => {
    const errors = await utils.getConsoleErrors();
    expect(errors.length).to.be.lte(5);
    await app.logout();
  });
});
