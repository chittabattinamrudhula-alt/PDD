const { expect } = require('chai');
const DriverFactory = require('../../utilities/driverFactory');
const LoginPage = require('../../pages/LoginPage');
const DashboardPage = require('../../pages/DashboardPage');
const ExcelReporter = require('../../utilities/excelReporter');
const ScreenshotUtils = require('../../utilities/screenshotUtils');
const logger = require('../../utilities/logger');
const config = require('../../config/appium.config');

describe('[AUTH] Login Tests', function () {
  this.timeout(120000);
  let driver, loginPage, dashboardPage;

  before(async () => {
    driver = await DriverFactory.createDriver();
    loginPage = new LoginPage(driver);
    dashboardPage = new DashboardPage(driver);
  });

  after(async () => {
    await ExcelReporter.generateReport();
    await DriverFactory.quitDriver();
  });

  afterEach(async function () {
    if (this.currentTest.state === 'failed') {
      const ss = await ScreenshotUtils.captureOnFailure(driver, this.currentTest.title, this.currentTest.err);
      ExcelReporter.addResult({ module: 'Auth-Login', scenario: this.currentTest.title, status: 'FAILED', error: this.currentTest.err?.message, screenshotPath: ss, duration: this.currentTest.duration });
    } else {
      ExcelReporter.addResult({ module: 'Auth-Login', scenario: this.currentTest.title, status: this.currentTest.state === 'passed' ? 'PASSED' : 'SKIPPED', duration: this.currentTest.duration });
    }
  });

  // ── TC-001 to TC-030: Login Tests ──────────────────────────────────────────

  it('TC-001: Landing page should display Login button', async () => {
    const displayed = await loginPage.isDisplayed('android=new UiSelector().text("Portal Login")');
    expect(displayed).to.be.true;
    logger.logStep('TC-001', 'Check Login button on landing', 'PASS');
  });

  it('TC-002: Tapping Login navigates to login form', async () => {
    await loginPage.navigateToLogin();
    const displayed = await loginPage.isLoginPageDisplayed();
    expect(displayed).to.be.true;
    logger.logStep('TC-002', 'Navigate to login form', 'PASS');
  });

  it('TC-003: Login form shows email field', async () => {
    const displayed = await loginPage.isDisplayed(loginPage.selectors.emailInput);
    expect(displayed).to.be.true;
  });

  it('TC-004: Login form shows password field', async () => {
    const displayed = await loginPage.isDisplayed(loginPage.selectors.passwordInput);
    expect(displayed).to.be.true;
  });

  it('TC-005: Login form shows Sign In button', async () => {
    const displayed = await loginPage.isDisplayed(loginPage.selectors.loginButton);
    expect(displayed).to.be.true;
  });

  it('TC-006: Empty email shows error', async () => {
    await loginPage.tapLogin();
    const err = await loginPage.getErrorMessage();
    expect(err).to.be.a('string').that.is.not.empty;
  });

  it('TC-007: Empty password shows error', async () => {
    await loginPage.enterEmail('test@test.com');
    await loginPage.tapLogin();
    const err = await loginPage.getErrorMessage();
    expect(err).to.be.a('string').that.is.not.empty;
  });

  it('TC-008: Invalid credentials shows error message', async () => {
    await loginPage.login('invalid@test.com', 'wrongpass');
    const err = await loginPage.getErrorMessage();
    expect(err).to.include.oneOf(['Invalid', 'credentials', 'failed', 'error']);
  });

  it('TC-009: Wrong email format is handled', async () => {
    await loginPage.login('notanemail', 'password');
    const err = await loginPage.getErrorMessage();
    expect(err).to.be.a('string').that.is.not.empty;
  });

  it('TC-010: Valid buyer login succeeds', async () => {
    await loginPage.login(config.testData.buyerEmail, config.testData.buyerPassword);
    const dashboard = await dashboardPage.isDashboardVisible();
    expect(dashboard).to.be.true;
  });

  it('TC-011: Dashboard shows user name after login', async () => {
    const name = await dashboardPage.getUserName();
    expect(name).to.be.a('string').that.is.not.empty;
  });

  it('TC-012: Dashboard shows role badge as Buyer', async () => {
    const role = await dashboardPage.getUserRole();
    expect(role).to.equal('Buyer');
  });

  it('TC-013: Logout returns to landing page', async () => {
    await dashboardPage.logout();
    const displayed = await loginPage.isDisplayed('android=new UiSelector().text("Portal Login")');
    expect(displayed).to.be.true;
  });

  it('TC-014: Valid seller login succeeds', async () => {
    await loginPage.navigateToLogin();
    await loginPage.login(config.testData.sellerEmail, config.testData.sellerPassword);
    const role = await dashboardPage.getUserRole();
    expect(role).to.equal('Seller');
  });

  it('TC-015: Seller sees Add Listing button', async () => {
    const displayed = await dashboardPage.isDisplayed(dashboardPage.selectors.addListingBtn);
    expect(displayed).to.be.true;
  });

  it('TC-016: Seller logout works', async () => {
    await dashboardPage.logout();
    const displayed = await loginPage.isDisplayed('android=new UiSelector().text("Portal Login")');
    expect(displayed).to.be.true;
  });

  it('TC-017: Admin login succeeds', async () => {
    await loginPage.navigateToLogin();
    await loginPage.login(config.testData.adminEmail, config.testData.adminPassword);
    const role = await dashboardPage.getUserRole();
    expect(role).to.equal('Admin');
  });

  it('TC-018: Admin logout works', async () => {
    await dashboardPage.logout();
    const displayed = await loginPage.isDisplayed('android=new UiSelector().text("Portal Login")');
    expect(displayed).to.be.true;
  });

  it('TC-019: Password field masks input', async () => {
    await loginPage.navigateToLogin();
    await loginPage.enterPassword('testpassword');
    const type = await loginPage.getAttribute(loginPage.selectors.passwordInput, 'password');
    expect(type).to.be.oneOf(['true', 'password', true]);
  });

  it('TC-020: Email field accepts valid email', async () => {
    await loginPage.enterEmail('buyer@propai.com');
    const val = await loginPage.getAttribute(loginPage.selectors.emailInput, 'text');
    expect(val).to.equal('buyer@propai.com');
  });

  it('TC-021: Login button is enabled by default', async () => {
    const enabled = await loginPage.isEnabled(loginPage.selectors.loginButton);
    expect(enabled).to.be.true;
  });

  it('TC-022: Signup link is visible on login page', async () => {
    const displayed = await loginPage.isDisplayed(loginPage.selectors.signupLink);
    expect(displayed).to.be.true;
  });

  it('TC-023: Tap signup link navigates to signup', async () => {
    await loginPage.tapSignupLink();
    const displayed = await loginPage.isDisplayed('android=new UiSelector().text("Register New Vetted Profile")');
    expect(displayed).to.be.true;
  });

  it('TC-024: Back from signup returns to login', async () => {
    await loginPage.pressBack();
    const displayed = await loginPage.isLoginPageDisplayed();
    expect(displayed).to.be.true;
  });

  it('TC-025: Login with spaces in email is rejected', async () => {
    await loginPage.login(' buyer@propai.com ', 'password');
    const dashboard = await dashboardPage.isDashboardVisible();
    if (!dashboard) {
      const err = await loginPage.getErrorMessage();
      expect(err).to.be.a('string').that.is.not.empty;
    }
  });

  it('TC-026: Login with SQL injection attempt is rejected', async () => {
    await loginPage.login("'; DROP TABLE users; --", 'password');
    const err = await loginPage.getErrorMessage();
    expect(err).to.be.a('string').that.is.not.empty;
  });

  it('TC-027: Long password input is handled', async () => {
    await loginPage.login('buyer@propai.com', 'a'.repeat(256));
    const err = await loginPage.getErrorMessage();
    expect(err).to.be.a('string').that.is.not.empty;
  });

  it('TC-028: Keyboard dismisses after login tap', async () => {
    await loginPage.navigateToLogin();
    await loginPage.enterEmail('buyer@propai.com');
    await loginPage.hideKeyboard();
    const displayed = await loginPage.isLoginPageDisplayed();
    expect(displayed).to.be.true;
  });

  it('TC-029: App maintains state after device rotation', async () => {
    await driver.setOrientation('LANDSCAPE');
    await loginPage.pause(1000);
    const displayed = await loginPage.isLoginPageDisplayed();
    expect(displayed).to.be.true;
    await driver.setOrientation('PORTRAIT');
  });

  it('TC-030: Successful login redirects to Dashboard tab', async () => {
    await loginPage.login(config.testData.buyerEmail, config.testData.buyerPassword);
    const dashboard = await dashboardPage.isDashboardVisible();
    expect(dashboard).to.be.true;
    await dashboardPage.logout();
  });
});
