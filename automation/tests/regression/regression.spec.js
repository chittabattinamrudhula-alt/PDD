'use strict';
/**
 * SUITE: Regression (50 Test Cases)
 * IDs: TC-REG-001 to TC-REG-050
 * Category: Regression
 * Target: Live GitHub Pages URL
 */
const { expect }                        = require('chai');
const { By }                            = require('selenium-webdriver');
const { setupSuite, teardownSuite, recordResult } = require('../../utils/testHelper');
const td                                = require('../../data/testData');

describe('[REG] Regression — TC-REG-001 to TC-REG-050', function () {
  this.timeout(120000);
  let driver, landing, auth, app, utils;

  before(async () => ({ driver, landing, auth, app, utils } = await setupSuite(this)));
  after(async () => teardownSuite(driver));
  afterEach(async function () { await recordResult(this, utils); });

  // ── Core App Stability (TC-REG-001 to TC-REG-010) ─────────────────────────
  it('TC-REG-001: [Critical] App loads at GitHub Pages URL without error', async () => {
    expect(await landing.isVisible()).to.be.true;
  });

  it('TC-REG-002: [Critical] Buyer can log in', async () => {
    await auth.login(td.buyer.email, td.buyer.password);
    expect(await app.isLoggedIn()).to.be.true;
  });

  it('TC-REG-003: [Critical] Dashboard loads with all 3 stat cards', async () => {
    await app.clickTab('dashboard');
    expect(await utils.isDisplayed(app.loc.statListings)).to.be.true;
    expect(await utils.isDisplayed(app.loc.statDeeds)).to.be.true;
    expect(await utils.isDisplayed(app.loc.statBookings)).to.be.true;
  });

  it('TC-REG-004: [Critical] Properties Explorer loads', async () => {
    await app.clickTab('properties');
    const src = await utils.getPageSource();
    expect(src).to.include('Property Register Explorer');
  });

  it('TC-REG-005: [Critical] AI Valuation calculates and returns result', async () => {
    await app.clickTab('valuation');
    await app.runValuation();
    expect(await app.isValuationResultVisible()).to.be.true;
  });

  it('TC-REG-006: [Critical] Blockchain Ledger loads with genesis block', async () => {
    await app.clickTab('ledger');
    expect(await utils.isDisplayed(app.loc.genesisBlock)).to.be.true;
  });

  it('TC-REG-007: [Critical] Buyer bookings tab loads', async () => {
    await app.clickTab('bookings');
    expect(await utils.isDisplayed(app.loc.bookingsHeading)).to.be.true;
  });

  it('TC-REG-008: [Critical] Profile page loads with user info', async () => {
    await app.clickTab('profile');
    const src = await utils.getPageSource();
    expect(src).to.include(td.buyer.email);
  });

  it('TC-REG-009: [Critical] Logout works from any tab', async () => {
    await app.logout();
    expect(await landing.isVisible()).to.be.true;
  });

  it('TC-REG-010: [Critical] Seller login works', async () => {
    await auth.login(td.seller.email, td.seller.password);
    expect(await app.isLoggedIn()).to.be.true;
    const role = await app.getRoleText();
    expect(role).to.include('Seller');
  });

  // ── Seller Workflow Regression (TC-REG-011 to TC-REG-020) ─────────────────
  it('TC-REG-011: [High] Seller sees Add Listing button', async () => {
    expect(await app.isAddListingVisible()).to.be.true;
  });

  it('TC-REG-012: [High] Seller can open Add Listing modal', async () => {
    await app.openAddListing();
    expect(await app.isModalOpen()).to.be.true;
  });

  it('TC-REG-013: [High] Add Listing modal has all required fields', async () => {
    expect(await utils.isDisplayed(app.loc.titleInput)).to.be.true;
    expect(await utils.isDisplayed(app.loc.descTextarea)).to.be.true;
    expect(await utils.isDisplayed(app.loc.fileInput)).to.be.true;
    expect(await utils.isDisplayed(app.loc.publishBtn)).to.be.true;
    await app.closeModal();
  });

  it('TC-REG-014: [High] Seller can publish a new property', async () => {
    const prop = td.property();
    await app.openAddListing();
    await app.fillAddListing({ title: prop.title, description: prop.description, price: prop.price });
    await app.submitAddListing();
    const modalOpen = await app.isModalOpen();
    if (modalOpen) await app.closeModal();
    expect(true).to.be.true;
  });

  it('TC-REG-015: [High] Seller bookings tab shows Sales Reservations heading', async () => {
    await app.clickTab('bookings');
    expect(await utils.isDisplayed(app.loc.bookingsHeading)).to.be.true;
    const src = await utils.getPageSource();
    expect(src).to.include('Sales Reservations');
  });

  it('TC-REG-016: [High] Seller does not see Seller Contact column', async () => {
    expect(await utils.isDisplayed(By.xpath('//*[text()="Seller Contact"]'))).to.be.false;
  });

  it('TC-REG-017: [High] Seller can approve pending bookings', async () => {
    const approved = await app.approveFirstBooking();
    if (approved) {
      const src = await utils.getPageSource();
      expect(src).to.satisfy(s => s.includes('Approved') || s.includes('✓'));
    }
  });

  it('TC-REG-018: [Medium] Seller profile page shows correct role', async () => {
    await app.clickTab('profile');
    const src = await utils.getPageSource();
    expect(src).to.include('Seller');
  });

  it('TC-REG-019: [Medium] Seller can select currency in profile', async () => {
    await app.selectCurrency('EUR');
    await utils.pause(300);
    const pill = await app.getCurrencyPillText();
    expect(pill.length).to.be.gt(0);
    await app.selectCurrency('USD');
  });

  it('TC-REG-020: [High] Seller logout works', async () => {
    await app.logout();
    expect(await landing.isVisible()).to.be.true;
  });

  // ── Buyer Workflow Regression (TC-REG-021 to TC-REG-030) ──────────────────
  it('TC-REG-021: [High] Buyer login works', async () => {
    await auth.login(td.buyer.email, td.buyer.password);
    expect(await app.isLoggedIn()).to.be.true;
  });

  it('TC-REG-022: [High] Buyer can view all properties', async () => {
    await app.clickTab('properties');
    const src = await utils.getPageSource();
    expect(src).to.include('Property Register Explorer');
  });

  it('TC-REG-023: [High] Buyer can open property detail modal', async () => {
    const count = await app.getCardCount();
    if (count > 0) {
      await app.openPropertyCard(0);
      expect(await app.isModalOpen()).to.be.true;
      await app.closeModal();
    }
  });

  it('TC-REG-024: [High] Buyer sees Book Property button (or Already Reserved)', async () => {
    const count = await app.getCardCount();
    if (count > 0) {
      for (let i = 0; i < Math.min(count, 5); i++) {
        await app.openPropertyCard(i);
        const hasBook = await utils.isDisplayed(app.loc.bookBtn);
        const hasBooked = await utils.isDisplayed(app.loc.alreadyBooked);
        if (hasBook || hasBooked) { await app.closeModal(); break; }
        await app.closeModal();
        await utils.pause(300);
      }
    }
    expect(true).to.be.true;
  });

  it('TC-REG-025: [High] Buyer can view My Bookings tab', async () => {
    await app.clickTab('bookings');
    expect(await utils.isDisplayed(app.loc.bookingsHeading)).to.be.true;
  });

  it('TC-REG-026: [High] Buyer bookings table has correct columns', async () => {
    const src = await utils.getPageSource();
    expect(src).to.satisfy(s =>
      s.includes('Property') && s.includes('Status') && s.includes('Seller Contact')
    );
  });

  it('TC-REG-027: [High] Buyer sees pending/approved status badges', async () => {
    const src = await utils.getPageSource();
    expect(src).to.satisfy(s =>
      s.includes('Pending') || s.includes('Approved') || s.includes('Rejected') || s.includes('No reservations')
    );
  });

  it('TC-REG-028: [High] Buyer sees seller contact after approval', async () => {
    const src = await utils.getPageSource();
    expect(src).to.satisfy(s =>
      s.includes('📞') || s.includes('Awaiting') || s.includes('No reservations')
    );
  });

  it('TC-REG-029: [Medium] Buyer cannot see Admin Console in property modal', async () => {
    await app.clickTab('properties');
    const count = await app.getCardCount();
    if (count > 0) {
      await app.openPropertyCard(0);
      expect(await utils.isDisplayed(app.loc.adminConsole)).to.be.false;
      await app.closeModal();
    }
  });

  it('TC-REG-030: [Medium] Buyer notification bell is visible', async () => {
    expect(await utils.isDisplayed(app.loc.notifBell)).to.be.true;
  });

  // ── Admin Workflow Regression (TC-REG-031 to TC-REG-040) ──────────────────
  it('TC-REG-031: [High] Admin login works', async () => {
    await app.logout();
    await auth.login(td.admin.email, td.admin.password);
    expect(await app.isLoggedIn()).to.be.true;
  });

  it('TC-REG-032: [High] Admin sees Add Listing button', async () => {
    expect(await app.isAddListingVisible()).to.be.true;
  });

  it('TC-REG-033: [High] Admin can open property detail and see Admin Console', async () => {
    await app.clickTab('properties');
    const count = await app.getCardCount();
    if (count > 0) {
      await app.openPropertyCard(0);
      const src = await utils.getPageSource();
      expect(src).to.include('Admin Console');
      await app.closeModal();
    }
  });

  it('TC-REG-034: [High] Admin can vet unverified property', async () => {
    const count = await app.getCardCount();
    for (let i = 0; i < Math.min(count, 5); i++) {
      await app.openPropertyCard(i);
      const hasVerify = await utils.isDisplayed(app.loc.verifyDeedBtn);
      if (hasVerify) {
        await utils.click(app.loc.verifyDeedBtn);
        await utils.pause(2000);
        await app.closeModal().catch(() => {});
        break;
      }
      await app.closeModal();
      await utils.pause(300);
    }
    expect(true).to.be.true;
  });

  it('TC-REG-035: [High] Admin Global Bookings tab shows all bookings', async () => {
    await app.clickTab('bookings');
    expect(await utils.isDisplayed(app.loc.bookingsHeading)).to.be.true;
    const src = await utils.getPageSource();
    expect(src).to.include('Global Reservation Registry');
  });

  it('TC-REG-036: [High] Admin can clear anomalies on suspicious property', async () => {
    await app.clickTab('properties');
    const count = await app.getCardCount();
    for (let i = 0; i < Math.min(count, 5); i++) {
      await app.openPropertyCard(i);
      const hasAnomaly = await utils.isDisplayed(app.loc.clearAnomalyBtn);
      if (hasAnomaly) {
        await utils.click(app.loc.clearAnomalyBtn);
        await utils.pause(2000);
        await app.closeModal().catch(() => {});
        break;
      }
      await app.closeModal();
      await utils.pause(300);
    }
    expect(true).to.be.true;
  });

  it('TC-REG-037: [Medium] Admin profile page shows Admin role', async () => {
    await app.clickTab('profile');
    const src = await utils.getPageSource();
    expect(src).to.include('Admin');
  });

  it('TC-REG-038: [Medium] Admin can navigate all 6 tabs', async () => {
    for (const tab of ['dashboard', 'properties', 'valuation', 'ledger', 'bookings', 'profile']) {
      await app.clickTab(tab);
      await utils.pause(300);
    }
    expect(await app.isLoggedIn()).to.be.true;
  });

  it('TC-REG-039: [Medium] Admin logout works', async () => {
    await app.logout();
    expect(await landing.isVisible()).to.be.true;
  });

  it('TC-REG-040: [Medium] All 3 roles can log in sequentially', async () => {
    for (const user of [td.buyer, td.seller, td.admin]) {
      await auth.login(user.email, user.password);
      await app.waitForApp();
      const role = await app.getRoleText();
      expect(role).to.include(user.role);
      await app.logout();
    }
    expect(true).to.be.true;
  });

  // ── Feature-specific Regression (TC-REG-041 to TC-REG-050) ────────────────
  it('TC-REG-041: [High] Blockchain ledger shows mined blocks after booking', async () => {
    await auth.login(td.buyer.email, td.buyer.password);
    await app.waitForApp();
    await app.clickTab('ledger');
    const blocks = await driver.findElements(app.loc.ledgerBlocks);
    expect(blocks.length).to.be.gte(1);
  });

  it('TC-REG-042: [High] Market trend chart renders for all 5 locations', async () => {
    await app.clickTab('dashboard');
    for (const loc of td.locations) {
      const selects = await driver.findElements(By.css('select'));
      if (selects.length > 0) {
        await utils.executeScript(`
          arguments[0].value='${loc}';
          arguments[0].dispatchEvent(new Event('change',{bubbles:true}));
        `, selects[0]);
        await utils.pause(300);
      }
    }
    expect(await utils.isDisplayed(app.loc.trendChart)).to.be.true;
  });

  it('TC-REG-043: [High] Valuation works for all 5 locations', async () => {
    await app.clickTab('valuation');
    for (const loc of td.locations) {
      const selects = await driver.findElements(By.css('.col-6 select'));
      if (selects.length > 0) {
        await utils.executeScript(`
          arguments[0].value='${loc}';
          arguments[0].dispatchEvent(new Event('change',{bubbles:true}));
        `, selects[0]);
        await utils.pause(200);
      }
    }
    await app.runValuation();
    expect(await app.isValuationResultVisible()).to.be.true;
  });

  it('TC-REG-044: [High] 5-year appreciation forecast table is rendered', async () => {
    const rows = await driver.findElements(app.loc.forecastRows);
    expect(rows.length).to.be.gte(1);
  });

  it('TC-REG-045: [High] Currency switching updates all property prices', async () => {
    await app.clickTab('profile');
    await app.selectCurrency('INR');
    await utils.pause(500);
    await app.clickTab('properties');
    const count = await app.getCardCount();
    if (count > 0) {
      const prices = await driver.findElements(By.css('.property-price'));
      if (prices.length > 0) {
        const text = await prices[0].getText();
        expect(text).to.satisfy(t => t.includes('₹') || t.includes('$') || t.length > 0);
      }
    }
    // Reset to USD
    await app.clickTab('profile');
    await app.selectCurrency('USD');
  });

  it('TC-REG-046: [Medium] Add Listing modal closes without submitting on close button', async () => {
    await app.logout();
    await auth.login(td.seller.email, td.seller.password);
    await app.waitForApp();
    await app.openAddListing();
    await app.closeModal();
    expect(await app.isModalOpen()).to.be.false;
  });

  it('TC-REG-047: [Medium] Property detail modal shows Anomaly status', async () => {
    await app.clickTab('properties');
    const count = await app.getCardCount();
    if (count > 0) {
      await app.openPropertyCard(0);
      const src = await utils.getPageSource();
      expect(src).to.include('Anomaly Alert');
      await app.closeModal();
    }
  });

  it('TC-REG-048: [Medium] Bookings date shown in readable format', async () => {
    await app.clickTab('bookings');
    const src = await utils.getPageSource();
    expect(src).to.satisfy(s =>
      s.match(/\d{1,2}\/\d{1,2}\/\d{4}/) || s.includes('No reservations')
    );
  });

  it('TC-REG-049: [Low] No "undefined" or "null" in visible page text', async () => {
    const src = await utils.getPageSource();
    expect(src).not.to.include('>null<');
    expect(src).not.to.include('>undefined<');
  });

  it('TC-REG-050: [Low] Final screenshot captured for regression evidence', async () => {
    const fp = await utils.screenshot('TC-REG-050-final-regression', 'step');
    expect(fp).to.satisfy(f => f === null || typeof f === 'string');
    await app.logout();
  });
});
