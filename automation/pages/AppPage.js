'use strict';
const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

/** Authenticated app shell — navbar, tabs, stat cards */
class AppPage extends BasePage {
  get loc() {
    return {
      // Navbar
      navbar:        By.css('.glass-navbar'),
      logo:          By.css('.nav-logo'),
      currencyPill:  By.css('.currency-pill'),
      notifBell:     By.xpath('//button[contains(.,"🔔")]'),
      notifPanel:    By.css('[style*="notification"], [style*="Notifications"]'),
      notifClear:    By.xpath('//button[contains(text(),"Clear all")]'),
      addListingBtn: By.xpath('//button[contains(text(),"+ Add Listing")]'),
      userBadge:     By.css('.user-profile-badge'),
      roleBadge:     By.css('.role-indicator'),
      logoutBtn:     By.xpath('//button[contains(text(),"Logout")]'),

      // Nav tabs
      tabDashboard:  By.xpath('//button[contains(@class,"nav-link") and contains(text(),"Dashboard")]'),
      tabProperties: By.xpath('//button[contains(@class,"nav-link") and contains(text(),"Properties")]'),
      tabValuation:  By.xpath('//button[contains(@class,"nav-link") and contains(text(),"Valuation")]'),
      tabLedger:     By.xpath('//button[contains(@class,"nav-link") and contains(text(),"Ledger")]'),
      tabBookings:   By.xpath('//button[contains(@class,"nav-link") and (contains(text(),"Bookings") or contains(text(),"Sales"))]'),
      tabProfile:    By.xpath('//button[contains(@class,"nav-link") and contains(text(),"Profile")]'),
      activeTab:     By.css('.nav-link.active'),

      // Dashboard stat cards
      statListings:  By.xpath('//*[contains(text(),"Database Listings")]'),
      statDeeds:     By.xpath('//*[contains(text(),"Blockchain Title Deeds")]'),
      statBookings:  By.xpath('//*[contains(text(),"System Bookings")]'),
      dashGrid:      By.css('.dashboard-grid'),
      trendChart:    By.css('svg'),
      locationSelect:By.css('select'),
      launchEstimator:By.xpath('//button[contains(text(),"Launch AI Estimator")]'),
      propCards:     By.css('.property-card'),
      featuredHeading:By.xpath('//*[contains(text(),"Featured Real Estate")]'),

      // Property cards
      cardImage:     By.css('.property-img'),
      cardTitle:     By.css('.property-title'),
      cardPrice:     By.css('.property-price'),
      inspectBtn:    By.xpath('//button[contains(text(),"Inspect")]'),

      // Modal
      modalOverlay:  By.css('.modal-overlay'),
      modalContent:  By.css('.modal-content'),
      modalClose:    By.xpath('//button[contains(text(),"✕ Close")]'),
      modalHeading:  By.css('.modal-content h2'),

      // Property detail modal
      auditHeading:  By.xpath('//*[contains(text(),"Audit Vetting Dashboard")]'),
      propInfoCard:  By.xpath('//*[text()="Property Info"]'),
      aiDiagCard:    By.xpath('//*[text()="AI Diagnostics"]'),
      blockchainCard:By.xpath('//*[contains(text(),"Cryptographic Verification")]'),
      unverifiedCard:By.xpath('//*[contains(text(),"Unverified Real Estate")]'),
      bookBtn:       By.xpath('//button[contains(text(),"Book Property")]'),
      alreadyBooked: By.xpath('//button[contains(text(),"Already Reserved")]'),
      adminConsole:  By.xpath('//*[contains(text(),"Admin Console")]'),
      verifyDeedBtn: By.xpath('//button[contains(text(),"Verify Deed On-Chain")]'),
      clearAnomalyBtn:By.xpath('//button[contains(text(),"Clear Anomalies")]'),

      // Add listing modal
      addModalHeading:By.xpath('//*[contains(text(),"Publish Vetted Deed Listing")]'),
      titleInput:    By.css('input[placeholder*="Waterfront"]'),
      descTextarea:  By.css('.modal-content textarea'),
      locationDrop:  By.css('.modal-content select'),
      fileInput:     By.css('input[type="file"]'),
      uploadArea:    By.xpath('//*[contains(.,"📷") or contains(.,"upload")]'),
      publishBtn:    By.xpath('//button[contains(text(),"Mine block and Publish")]'),
      publishingBtn: By.xpath('//button[contains(text(),"Uploading")]'),

      // Blockchain Ledger
      ledgerHeading: By.xpath('//*[contains(text(),"Title Registry Blockchain Ledger")]'),
      ledgerBlocks:  By.css('.ledger-block'),
      genesisBlock:  By.xpath('//*[contains(text(),"Genesis")]'),
      chainIntact:   By.xpath('//*[contains(text(),"Chain Cryptographically Intact")]'),
      hashText:      By.css('.hash-text'),

      // Bookings
      bookingsHeading:By.xpath('//*[contains(text(),"My Property Bookings") or contains(text(),"Sales Reservations") or contains(text(),"Global Reservation")]'),
      bookingsTable: By.css('.custom-table'),
      bookingsRows:  By.css('.custom-table tbody tr'),
      approveBtn:    By.xpath('//button[contains(text(),"Approve")]'),
      rejectBtn:     By.xpath('//button[contains(text(),"Reject")]'),
      pendingBadge:  By.xpath('//*[contains(text(),"Pending") or contains(text(),"⏳")]'),
      approvedBadge: By.xpath('//*[contains(text(),"Approved") or contains(text(),"✓ Approved")]'),
      rejectedBadge: By.xpath('//*[contains(text(),"Rejected") or contains(text(),"✗ Rejected")]'),
      sellerContact: By.xpath('//*[contains(text(),"📞")]'),
      awaitingAppr:  By.xpath('//*[contains(text(),"Awaiting seller approval")]'),
      emptyBookings: By.xpath('//*[contains(text(),"No reservations")]'),

      // Valuation
      valHeading:    By.xpath('//*[contains(text(),"AI-Powered Property Valuation")]'),
      valCalcBtn:    By.xpath('//button[contains(text(),"Calculate Property Valuation")]'),
      valResult:     By.xpath('//*[contains(text(),"Appraised Fair Value")]'),
      valConfidence: By.xpath('//*[contains(text(),"Confidence Index")]'),
      valRecommend:  By.xpath('//*[contains(text(),"Investment Recommendation")]'),
      valForecast:   By.xpath('//*[contains(text(),"Appreciation Forecast")]'),
      computingBtn:  By.xpath('//button[contains(text(),"Computing")]'),
      gaugeWrapper:  By.css('.gauge-wrapper'),
      forecastRows:  By.css('table tbody tr'),

      // Profile
      profileHeading:By.xpath('//*[contains(text(),"My Profile")]'),
      profileAvatar: By.css('.profile-avatar'),
      currencyGrid:  By.css('.currency-grid'),
      currencyCards: By.css('.currency-card'),
      signOutBtn:    By.xpath('//button[contains(text(),"Sign Out")]'),
      profileEmail:  By.css('.profile-info-value'),
    };
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  async clickTab(tab) {
    const map = {
      dashboard:  this.loc.tabDashboard,
      properties: this.loc.tabProperties,
      valuation:  this.loc.tabValuation,
      ledger:     this.loc.tabLedger,
      bookings:   this.loc.tabBookings,
      profile:    this.loc.tabProfile,
    };
    await this.w.click(map[tab]);
    await this.w.pause(600);
  }

  async logout() {
    await this.w.click(this.loc.logoutBtn);
    await this.w.pause(600);
  }

  async isLoggedIn() {
    return this.w.isDisplayed(this.loc.logoutBtn);
  }

  async waitForApp() {
    await this.w.waitForElement(this.loc.tabDashboard, 30000);
  }

  // ── Property modal ────────────────────────────────────────────────────────
  async openPropertyCard(index = 0) {
    const cards = await this.driver.findElements(this.loc.propCards);
    if (cards[index]) await cards[index].click();
    await this.w.waitForElement(this.loc.modalContent);
  }

  async closeModal() {
    const btn = await this.driver.findElement(this.loc.modalClose).catch(() => null);
    if (btn) await btn.click();
    else await this.w.executeScript("document.querySelector('.modal-overlay')?.click()");
    await this.w.pause(400);
  }

  async isModalOpen() { return this.w.isDisplayed(this.loc.modalContent); }

  async getCardCount() {
    const els = await this.driver.findElements(this.loc.propCards);
    return els.length;
  }

  // ── Add listing modal ─────────────────────────────────────────────────────
  async openAddListing() {
    await this.w.click(this.loc.addListingBtn);
    await this.w.waitForElement(this.loc.addModalHeading);
  }

  async fillAddListing({ title, description, price } = {}) {
    if (title) {
      const el = await this.driver.findElement(this.loc.titleInput);
      await el.clear(); await el.sendKeys(title);
    }
    if (description) {
      const el = await this.driver.findElement(this.loc.descTextarea);
      await el.clear(); await el.sendKeys(description);
    }
    if (price) {
      const nums = await this.driver.findElements(By.css('.modal-content input[type="number"]'));
      const last = nums[nums.length - 1];
      if (last) { await last.clear(); await last.sendKeys(String(price)); }
    }
  }

  async submitAddListing() {
    await this.w.click(this.loc.publishBtn);
    await this.w.pause(3000);
  }

  // ── Notifications ─────────────────────────────────────────────────────────
  async openNotifPanel() {
    await this.w.click(this.loc.notifBell);
    await this.w.pause(300);
  }

  async clearNotifications() {
    const visible = await this.w.isDisplayed(this.loc.notifClear);
    if (visible) await this.w.click(this.loc.notifClear);
  }

  // ── Valuation ─────────────────────────────────────────────────────────────
  async runValuation() {
    await this.w.click(this.loc.valCalcBtn);
    await this.w.waitForElement(this.loc.valResult, 30000);
  }

  async isValuationResultVisible() { return this.w.isDisplayed(this.loc.valResult); }

  // ── Currency ──────────────────────────────────────────────────────────────
  async selectCurrency(code) {
    const cards = await this.driver.findElements(this.loc.currencyCards);
    for (const card of cards) {
      const text = await card.getText();
      if (text.includes(code)) { await card.click(); await this.w.pause(300); return; }
    }
  }

  async getCurrencyPillText() { return this.w.getText(this.loc.currencyPill).catch(() => ''); }

  // ── Bookings ──────────────────────────────────────────────────────────────
  async approveFirstBooking() {
    const btns = await this.driver.findElements(this.loc.approveBtn);
    if (btns.length > 0) { await btns[0].click(); await this.w.pause(1500); return true; }
    return false;
  }

  async rejectFirstBooking() {
    const btns = await this.driver.findElements(this.loc.rejectBtn);
    if (btns.length > 0) { await btns[0].click(); await this.w.pause(1500); return true; }
    return false;
  }

  async getBookingRowCount() {
    const rows = await this.driver.findElements(this.loc.bookingsRows);
    return rows.length;
  }

  // ── Role helpers ──────────────────────────────────────────────────────────
  async getRoleText() { return this.w.getText(this.loc.roleBadge).catch(() => ''); }
  async isAddListingVisible() { return this.w.isDisplayed(this.loc.addListingBtn); }
}

module.exports = AppPage;
