const { expect } = require('chai');
const DriverFactory = require('../../utilities/driverFactory');
const LoginPage = require('../../pages/LoginPage');
const DashboardPage = require('../../pages/DashboardPage');
const ExcelReporter = require('../../utilities/excelReporter');
const ScreenshotUtils = require('../../utilities/screenshotUtils');
const config = require('../../config/appium.config');

describe('[DASHBOARD] Dashboard Tests', function () {
  this.timeout(120000);
  let driver, loginPage, dashboardPage;

  before(async () => {
    driver = await DriverFactory.createDriver();
    loginPage = new LoginPage(driver);
    dashboardPage = new DashboardPage(driver);
    await loginPage.navigateToLogin();
    await loginPage.login(config.testData.buyerEmail, config.testData.buyerPassword);
    await dashboardPage.waitForDashboard();
  });

  after(async () => {
    await dashboardPage.logout();
    await DriverFactory.quitDriver();
  });

  afterEach(async function () {
    const status = this.currentTest.state === 'passed' ? 'PASSED' : this.currentTest.state === 'failed' ? 'FAILED' : 'SKIPPED';
    if (status === 'FAILED') {
      const ss = await ScreenshotUtils.captureOnFailure(driver, this.currentTest.title, this.currentTest.err);
      ExcelReporter.addResult({ module: 'Dashboard', scenario: this.currentTest.title, status, error: this.currentTest.err?.message, screenshotPath: ss, duration: this.currentTest.duration });
    } else {
      ExcelReporter.addResult({ module: 'Dashboard', scenario: this.currentTest.title, status, duration: this.currentTest.duration });
    }
  });

  it('TC-051: Dashboard tab is active after login', async () => {
    const visible = await dashboardPage.isDashboardVisible();
    expect(visible).to.be.true;
  });

  it('TC-052: Total listings stat card is visible', async () => {
    const displayed = await dashboardPage.isDisplayed(dashboardPage.selectors.totalListings);
    expect(displayed).to.be.true;
  });

  it('TC-053: Blockchain verified stat card is visible', async () => {
    const displayed = await dashboardPage.isDisplayed(dashboardPage.selectors.totalVerified);
    expect(displayed).to.be.true;
  });

  it('TC-054: System bookings stat card is visible', async () => {
    const displayed = await dashboardPage.isDisplayed(dashboardPage.selectors.totalBookings);
    expect(displayed).to.be.true;
  });

  it('TC-055: Currency pill shows USD by default', async () => {
    const currency = await dashboardPage.getCurrencyCode();
    expect(currency).to.include('USD');
  });

  it('TC-056: Trend chart section is visible', async () => {
    const displayed = await dashboardPage.isDisplayed(dashboardPage.selectors.trendChart);
    expect(displayed).to.be.true;
  });

  it('TC-057: Diagnostics card is visible', async () => {
    const displayed = await dashboardPage.isDisplayed(dashboardPage.selectors.diagnosticsCard);
    expect(displayed).to.be.true;
  });

  it('TC-058: Featured listings section is visible', async () => {
    const displayed = await dashboardPage.isDisplayed(dashboardPage.selectors.featuredSection);
    expect(displayed).to.be.true;
  });

  it('TC-059: Properties tab navigates to explorer', async () => {
    await dashboardPage.navigateTo('properties');
    const displayed = await dashboardPage.isDisplayed('android=new UiSelector().text("Property Register Explorer")');
    expect(displayed).to.be.true;
  });

  it('TC-060: Dashboard tab switches back', async () => {
    await dashboardPage.navigateTo('dashboard');
    const visible = await dashboardPage.isDashboardVisible();
    expect(visible).to.be.true;
  });

  it('TC-061: Valuation tab navigates to AI Valuation', async () => {
    await dashboardPage.navigateTo('valuation');
    const displayed = await dashboardPage.isDisplayed('android=new UiSelector().text("AI-Powered Property Valuation Simulator")');
    expect(displayed).to.be.true;
  });

  it('TC-062: Ledger tab navigates to Blockchain Ledger', async () => {
    await dashboardPage.navigateTo('ledger');
    const displayed = await dashboardPage.isDisplayed('android=new UiSelector().text("Title Registry Blockchain Ledger")');
    expect(displayed).to.be.true;
  });

  it('TC-063: Bookings tab navigates to bookings', async () => {
    await dashboardPage.navigateTo('bookings');
    const displayed = await dashboardPage.isDisplayed('android=new UiSelector().text("My Property Bookings")');
    expect(displayed).to.be.true;
  });

  it('TC-064: Profile tab navigates to profile page', async () => {
    await dashboardPage.navigateTo('profile');
    const displayed = await dashboardPage.isDisplayed('android=new UiSelector().text("My Profile")');
    expect(displayed).to.be.true;
  });

  it('TC-065: Total listings count is a number', async () => {
    await dashboardPage.navigateTo('dashboard');
    const count = await dashboardPage.getTotalListings();
    expect(parseInt(count)).to.be.gte(0);
  });

  it('TC-066: Location dropdown on dashboard changes chart', async () => {
    await dashboardPage.selectLocation('Downtown');
    await dashboardPage.pause(1000);
    const displayed = await dashboardPage.isDisplayed(dashboardPage.selectors.trendChart);
    expect(displayed).to.be.true;
  });

  it('TC-067: Beachfront location selection works', async () => {
    await dashboardPage.selectLocation('Beachfront');
    await dashboardPage.pause(1000);
    const displayed = await dashboardPage.isDisplayed(dashboardPage.selectors.trendChart);
    expect(displayed).to.be.true;
  });

  it('TC-068: Launch AI Estimator button navigates to valuation', async () => {
    await dashboardPage.click(dashboardPage.selectors.launchEstimator);
    const displayed = await dashboardPage.isDisplayed('android=new UiSelector().text("AI-Powered Property Valuation Simulator")');
    expect(displayed).to.be.true;
  });

  it('TC-069: Dashboard scrolls vertically', async () => {
    await dashboardPage.navigateTo('dashboard');
    const gestures = new (require('../../utilities/gestureUtils'))(driver);
    await gestures.scrollDown(2);
    const displayed = await dashboardPage.isDisplayed(dashboardPage.selectors.featuredSection);
    expect(displayed).to.be.true;
  });

  it('TC-070: Featured property card is tappable', async () => {
    await dashboardPage.navigateTo('dashboard');
    await dashboardPage.tapPropertyCard(0);
    const modal = await dashboardPage.isDisplayed('~modal-overlay');
    expect(modal).to.be.true;
    await dashboardPage.click('android=new UiSelector().text("✕ Close")');
  });

  it('TC-071: Logout button is visible', async () => {
    const displayed = await dashboardPage.isDisplayed(dashboardPage.selectors.logoutBtn);
    expect(displayed).to.be.true;
  });

  it('TC-072: User name is displayed in navbar', async () => {
    const name = await dashboardPage.getUserName();
    expect(name).to.be.a('string').that.is.not.empty;
  });

  it('TC-073: Dashboard accessible in landscape mode', async () => {
    await driver.setOrientation('LANDSCAPE');
    await dashboardPage.pause(1000);
    const visible = await dashboardPage.isDashboardVisible();
    expect(visible).to.be.true;
    await driver.setOrientation('PORTRAIT');
  });

  it('TC-074: Stats cards show non-negative numbers', async () => {
    const count = await dashboardPage.getTotalListings();
    expect(parseInt(count)).to.be.gte(0);
  });

  it('TC-075: Suburbs location on chart works', async () => {
    await dashboardPage.selectLocation('Suburbs');
    await dashboardPage.pause(500);
    const displayed = await dashboardPage.isDisplayed(dashboardPage.selectors.trendChart);
    expect(displayed).to.be.true;
  });

  it('TC-076: Rural location on chart works', async () => {
    await dashboardPage.selectLocation('Rural');
    await dashboardPage.pause(500);
    const displayed = await dashboardPage.isDisplayed(dashboardPage.selectors.trendChart);
    expect(displayed).to.be.true;
  });

  it('TC-077: Uptown location on chart works', async () => {
    await dashboardPage.selectLocation('Uptown');
    await dashboardPage.pause(500);
    const displayed = await dashboardPage.isDisplayed(dashboardPage.selectors.trendChart);
    expect(displayed).to.be.true;
  });

  it('TC-078: All 6 nav tabs are visible', async () => {
    const tabs = ['dashboard', 'properties', 'valuation', 'ledger', 'bookings', 'profile'];
    for (const tab of tabs) {
      const visible = await dashboardPage.isDisplayed(`~${tab}-tab`);
      expect(visible, `Tab ${tab} should be visible`).to.be.true;
    }
  });

  it('TC-079: App bar renders PropAI logo text', async () => {
    const displayed = await dashboardPage.isDisplayed('android=new UiSelector().text("PropAI")');
    expect(displayed).to.be.true;
  });

  it('TC-080: Dashboard renders after app restart', async () => {
    await DriverFactory.restartApp();
    await loginPage.navigateToLogin();
    await loginPage.login(config.testData.buyerEmail, config.testData.buyerPassword);
    await dashboardPage.waitForDashboard();
    const visible = await dashboardPage.isDashboardVisible();
    expect(visible).to.be.true;
  });
});
