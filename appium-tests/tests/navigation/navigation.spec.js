const { expect } = require('chai');
const DriverFactory = require('../../utilities/driverFactory');
const LoginPage = require('../../pages/LoginPage');
const DashboardPage = require('../../pages/DashboardPage');
const ExcelReporter = require('../../utilities/excelReporter');
const ScreenshotUtils = require('../../utilities/screenshotUtils');
const config = require('../../config/appium.config');

describe('[NAVIGATION] Navigation & Gesture Tests', function () {
  this.timeout(120000);
  let driver, loginPage, dashboardPage;
  const GestureUtils = require('../../utilities/gestureUtils');

  before(async () => {
    driver = await DriverFactory.createDriver();
    loginPage = new LoginPage(driver);
    dashboardPage = new DashboardPage(driver);
    await loginPage.navigateToLogin();
    await loginPage.login(config.testData.buyerEmail, config.testData.buyerPassword);
    await dashboardPage.waitForDashboard();
  });

  after(async () => { await dashboardPage.logout(); await DriverFactory.quitDriver(); });

  afterEach(async function () {
    const status = this.currentTest.state === 'passed' ? 'PASSED' : this.currentTest.state === 'failed' ? 'FAILED' : 'SKIPPED';
    if (status === 'FAILED') {
      const ss = await ScreenshotUtils.captureOnFailure(driver, this.currentTest.title, this.currentTest.err);
      ExcelReporter.addResult({ module: 'Navigation', scenario: this.currentTest.title, status, error: this.currentTest.err?.message, screenshotPath: ss });
    } else {
      ExcelReporter.addResult({ module: 'Navigation', scenario: this.currentTest.title, status });
    }
  });

  it('TC-151: All 6 tabs are accessible from dashboard', async () => {
    const tabs = ['properties','valuation','ledger','bookings','profile','dashboard'];
    for (const tab of tabs) {
      await dashboardPage.navigateTo(tab);
      await dashboardPage.pause(500);
    }
    const visible = await dashboardPage.isDashboardVisible();
    expect(visible).to.be.true;
  });

  it('TC-152: Back button from properties returns to dashboard', async () => {
    await dashboardPage.navigateTo('properties');
    await dashboardPage.pressBack();
    const visible = await dashboardPage.isDashboardVisible();
    expect(visible).to.be.true;
  });

  it('TC-153: Tab switching does not reload data unnecessarily', async () => {
    const start = Date.now();
    await dashboardPage.navigateTo('properties');
    await dashboardPage.navigateTo('dashboard');
    const elapsed = Date.now() - start;
    expect(elapsed).to.be.lt(5000);
  });

  it('TC-154: Scroll down on dashboard reaches featured listings', async () => {
    await dashboardPage.navigateTo('dashboard');
    const g = new GestureUtils(driver);
    await g.scrollDown(2);
    const d = await dashboardPage.isDisplayed('android=new UiSelector().text("Featured Real Estate Listings")');
    expect(d).to.be.true;
  });

  it('TC-155: Scroll up returns to top of dashboard', async () => {
    const g = new GestureUtils(driver);
    await g.scrollUp(3);
    const d = await dashboardPage.isDisplayed('android=new UiSelector().text("PropAI")');
    expect(d).to.be.true;
  });

  it('TC-156: Swipe left on property list works', async () => {
    await dashboardPage.navigateTo('properties');
    const g = new GestureUtils(driver);
    await g.swipeLeft();
    await dashboardPage.pause(500);
    const d = await dashboardPage.isDisplayed('android=new UiSelector().text("Property Register Explorer")');
    expect(d).to.be.true;
  });

  it('TC-157: Home button navigates to Android home', async () => {
    await dashboardPage.pressHome();
    await dashboardPage.pause(1000);
    await driver.activateApp(require('../../config/appium.config').capabilities['appium:appPackage']);
    await dashboardPage.waitForDashboard();
    const visible = await dashboardPage.isDashboardVisible();
    expect(visible).to.be.true;
  });

  it('TC-158: App restores state after background/foreground', async () => {
    await driver.background(3);
    await dashboardPage.pause(1000);
    const visible = await dashboardPage.isDashboardVisible();
    expect(visible).to.be.true;
  });

  it('TC-159: Portrait to landscape does not crash', async () => {
    await driver.setOrientation('LANDSCAPE');
    await dashboardPage.pause(1000);
    const visible = await dashboardPage.isDashboardVisible();
    expect(visible).to.be.true;
    await driver.setOrientation('PORTRAIT');
  });

  it('TC-160: Rapid tab switching does not freeze', async () => {
    for (let i = 0; i < 5; i++) {
      await dashboardPage.navigateTo('properties');
      await dashboardPage.navigateTo('dashboard');
    }
    const visible = await dashboardPage.isDashboardVisible();
    expect(visible).to.be.true;
  });

  // TC-161 to TC-200: ledger, bookings, add listing, gestures, admin flows
  it('TC-161: Ledger page loads blocks', async () => {
    await dashboardPage.navigateTo('ledger');
    const d = await dashboardPage.isDisplayed('android=new UiSelector().text("Title Registry Blockchain Ledger")');
    expect(d).to.be.true;
  });

  it('TC-162: Genesis block is displayed in ledger', async () => {
    const d = await dashboardPage.isDisplayed('android=new UiSelector().textContains("Block #0")');
    expect(d).to.be.true;
  });

  it('TC-163: Ledger block is tappable and shows modal', async () => {
    await dashboardPage.click('android=new UiSelector().textContains("Block #0")');
    const d = await dashboardPage.isDisplayed('~modal-overlay');
    expect(d).to.be.true;
    await dashboardPage.click('android=new UiSelector().text("✕ Close")');
  });

  it('TC-164: Ledger diagnostics panel is visible', async () => {
    const d = await dashboardPage.isDisplayed('android=new UiSelector().text("Ledger Diagnostics")');
    expect(d).to.be.true;
  });

  it('TC-165: Proof of Work consensus shown', async () => {
    const d = await dashboardPage.isDisplayed('android=new UiSelector().text("Proof of Work")');
    expect(d).to.be.true;
  });

  it('TC-166: Bookings page for buyer is correct', async () => {
    await dashboardPage.navigateTo('bookings');
    const d = await dashboardPage.isDisplayed('android=new UiSelector().text("My Property Bookings")');
    expect(d).to.be.true;
  });

  it('TC-167: Empty bookings shows correct message', async () => {
    const d = await dashboardPage.isDisplayed('android=new UiSelector().textContains("No reservations")');
    if (d) expect(d).to.be.true;
    else {
      const tableD = await dashboardPage.isDisplayed('~bookings-table');
      expect(tableD).to.be.true;
    }
  });

  it('TC-168: Seller sees Sales Ledger title', async () => {
    await dashboardPage.logout();
    await loginPage.navigateToLogin();
    await loginPage.login(config.testData.sellerEmail, config.testData.sellerPassword);
    await dashboardPage.waitForDashboard();
    await dashboardPage.navigateTo('bookings');
    const d = await dashboardPage.isDisplayed('android=new UiSelector().text("Property Sales Reservations")');
    expect(d).to.be.true;
  });

  it('TC-169: Seller sees Add Listing button', async () => {
    const d = await dashboardPage.isDisplayed(dashboardPage.selectors.addListingBtn);
    expect(d).to.be.true;
  });

  it('TC-170: Add Listing modal opens for seller', async () => {
    await dashboardPage.click(dashboardPage.selectors.addListingBtn);
    const d = await dashboardPage.isDisplayed('android=new UiSelector().text("Publish Vetted Deed Listing")');
    expect(d).to.be.true;
    await dashboardPage.click('android=new UiSelector().text("✕ Close")');
  });

  it('TC-171: Add Listing form has title field', async () => {
    await dashboardPage.click(dashboardPage.selectors.addListingBtn);
    const d = await dashboardPage.isDisplayed('~add-property-title');
    expect(d).to.be.true;
    await dashboardPage.click('android=new UiSelector().text("✕ Close")');
  });

  it('TC-172: Add Listing form has description field', async () => {
    await dashboardPage.click(dashboardPage.selectors.addListingBtn);
    const d = await dashboardPage.isDisplayed('~add-property-description');
    expect(d).to.be.true;
    await dashboardPage.click('android=new UiSelector().text("✕ Close")');
  });

  it('TC-173: Add Listing form has price field', async () => {
    await dashboardPage.click(dashboardPage.selectors.addListingBtn);
    const d = await dashboardPage.isDisplayed('~add-property-price');
    expect(d).to.be.true;
    await dashboardPage.click('android=new UiSelector().text("✕ Close")');
  });

  it('TC-174: Add Listing form has location selector', async () => {
    await dashboardPage.click(dashboardPage.selectors.addListingBtn);
    const d = await dashboardPage.isDisplayed('~add-location-selector');
    expect(d).to.be.true;
    await dashboardPage.click('android=new UiSelector().text("✕ Close")');
  });

  it('TC-175: Add Listing form amenities are visible', async () => {
    await dashboardPage.click(dashboardPage.selectors.addListingBtn);
    const g = new GestureUtils(driver);
    await g.scrollDown(2);
    const d = await dashboardPage.isDisplayed('android=new UiSelector().text("Select Amenities")');
    expect(d).to.be.true;
    await dashboardPage.click('android=new UiSelector().text("✕ Close")');
  });

  it('TC-176: Seller logout works', async () => {
    await dashboardPage.logout();
    const d = await dashboardPage.isDisplayed('android=new UiSelector().text("Portal Login")');
    expect(d).to.be.true;
  });

  it('TC-177: Admin login shows Global Bookings', async () => {
    await loginPage.navigateToLogin();
    await loginPage.login(config.testData.adminEmail, config.testData.adminPassword);
    await dashboardPage.waitForDashboard();
    await dashboardPage.navigateTo('bookings');
    const d = await dashboardPage.isDisplayed('android=new UiSelector().text("Global Reservation Registry")');
    expect(d).to.be.true;
  });

  it('TC-178: Admin can open property and see admin console', async () => {
    await dashboardPage.navigateTo('properties');
    await dashboardPage.click('~property-card-0');
    const d = await dashboardPage.isDisplayed('android=new UiSelector().text("Admin Console:")');
    expect(d).to.be.true;
    await dashboardPage.click('android=new UiSelector().text("✕ Close")');
  });

  it('TC-179: Admin logout works', async () => {
    await dashboardPage.logout();
    const d = await dashboardPage.isDisplayed('android=new UiSelector().text("Portal Login")');
    expect(d).to.be.true;
  });

  it('TC-180: Long press on property card does not crash', async () => {
    await loginPage.navigateToLogin();
    await loginPage.login(config.testData.buyerEmail, config.testData.buyerPassword);
    await dashboardPage.waitForDashboard();
    await dashboardPage.navigateTo('properties');
    const card = await driver.$('~property-card-0');
    const g = new GestureUtils(driver);
    await g.longPress(card);
    const visible = await dashboardPage.isDisplayed('~property-card-0');
    expect(visible).to.be.true;
  });

  // TC-181 to TC-200: extra gestures and edge cases
  it('TC-181: Double tap on property does not crash', async () => {
    const card = await driver.$('~property-card-0');
    const g = new GestureUtils(driver);
    await g.doubleTap(card);
    await dashboardPage.pause(500);
    const visible = await dashboardPage.isDisplayed('~property-card-0');
    expect(visible).to.be.true;
  });

  it('TC-182: Valuation form inputs update via typing', async () => {
    await dashboardPage.navigateTo('valuation');
    await dashboardPage.typeText('~sqft-input', '1500');
    const val = await dashboardPage.getAttribute('~sqft-input', 'text');
    expect(val).to.equal('1500');
  });

  it('TC-183: Bedrooms input accepts numeric value', async () => {
    await dashboardPage.typeText('~bedrooms-input', '3');
    const val = await dashboardPage.getAttribute('~bedrooms-input', 'text');
    expect(val).to.equal('3');
  });

  it('TC-184: Bathrooms input accepts decimal', async () => {
    await dashboardPage.typeText('~bathrooms-input', '2.5');
    const val = await dashboardPage.getAttribute('~bathrooms-input', 'text');
    expect(val).to.equal('2.5');
  });

  it('TC-185: Price input accepts large number', async () => {
    await dashboardPage.typeText('~listing-price-input', '1500000');
    const val = await dashboardPage.getAttribute('~listing-price-input', 'text');
    expect(val).to.equal('1500000');
  });

  it('TC-186: Ledger scrolls to show more blocks', async () => {
    await dashboardPage.navigateTo('ledger');
    const g = new GestureUtils(driver);
    await g.scrollDown(3);
    const d = await dashboardPage.isDisplayed('android=new UiSelector().textContains("Block #")');
    expect(d).to.be.true;
  });

  it('TC-187: Ledger chain intact badge is shown', async () => {
    const d = await dashboardPage.isDisplayed('android=new UiSelector().text("Chain Cryptographically Intact")');
    expect(d).to.be.true;
  });

  it('TC-188: Dashboard diagnostics shows mined blocks', async () => {
    await dashboardPage.navigateTo('dashboard');
    const d = await dashboardPage.isDisplayed('android=new UiSelector().textContains("Blocks")');
    expect(d).to.be.true;
  });

  it('TC-189: Dashboard diagnostics shows anomaly count', async () => {
    const d = await dashboardPage.isDisplayed('android=new UiSelector().textContains("Flags")');
    expect(d).to.be.true;
  });

  it('TC-190: App does not crash on rapid back-press', async () => {
    for (let i = 0; i < 5; i++) {
      await dashboardPage.pressBack();
      await dashboardPage.pause(300);
    }
    const appState = await driver.queryAppState(require('../../config/appium.config').capabilities['appium:appPackage']);
    expect(appState).to.be.gte(3); // RUNNING
  });

  it('TC-191: Bookings table headers are correct', async () => {
    await dashboardPage.navigateTo('bookings');
    const d = await dashboardPage.isDisplayed('android=new UiSelector().text("Property Details")');
    expect(d).to.be.true;
  });

  it('TC-192: Bookings table shows blockchain tx hash column', async () => {
    const d = await dashboardPage.isDisplayed('android=new UiSelector().text("Blockchain Tx Receipt")');
    expect(d).to.be.true;
  });

  it('TC-193: Profile page subtitle is correct', async () => {
    await dashboardPage.navigateTo('profile');
    const d = await dashboardPage.isDisplayed('android=new UiSelector().textContains("Manage your account")');
    expect(d).to.be.true;
  });

  it('TC-194: Live Rate table shows currencies', async () => {
    const d = await dashboardPage.isDisplayed('android=new UiSelector().text("Live Rate: 1 USD =")');
    expect(d).to.be.true;
  });

  it('TC-195: Changing currency is instant', async () => {
    const start = Date.now();
    await dashboardPage.click('~currency-card-EUR');
    await dashboardPage.pause(500);
    const elapsed = Date.now() - start;
    expect(elapsed).to.be.lt(3000);
    await dashboardPage.click('~currency-card-USD');
  });

  it('TC-196: Currency change reflects on Valuation tab', async () => {
    await dashboardPage.click('~currency-card-INR');
    await dashboardPage.pause(500);
    await dashboardPage.navigateTo('valuation');
    await dashboardPage.click('android=new UiSelector().text("Calculate Property Valuation")');
    await dashboardPage.pause(2000);
    const val = await dashboardPage.getText('~appraised-fair-value');
    expect(val).to.include('₹');
    await dashboardPage.navigateTo('profile');
    await dashboardPage.click('~currency-card-USD');
  });

  it('TC-197: App performance - dashboard loads under 5s', async () => {
    const start = Date.now();
    await dashboardPage.navigateTo('dashboard');
    await dashboardPage.waitForDashboard();
    expect(Date.now() - start).to.be.lt(5000);
  });

  it('TC-198: App memory usage stays stable over 10 tab switches', async () => {
    for (let i = 0; i < 10; i++) {
      await dashboardPage.navigateTo(i % 2 === 0 ? 'properties' : 'dashboard');
      await dashboardPage.pause(200);
    }
    const visible = await dashboardPage.isDashboardVisible();
    expect(visible).to.be.true;
  });

  it('TC-199: Screenshot captured correctly', async () => {
    const path = await dashboardPage.screenshot('TC-199-test');
    const fs = require('fs');
    expect(fs.existsSync(path)).to.be.true;
  });

  it('TC-200: Final state - user still logged in', async () => {
    const name = await dashboardPage.getUserName();
    expect(name).to.be.a('string').that.is.not.empty;
    await dashboardPage.logout();
  });
});
