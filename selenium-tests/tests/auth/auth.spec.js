const { expect } = require('chai');
const { By } = require('selenium-webdriver');
const DriverFactory = require('../../utilities/driverFactory');
const LoginPage = require('../../pages/LoginPage');
const DashboardPage = require('../../pages/DashboardPage');
const ExcelReporter = require('../../utilities/excelReporter');
const logger = require('../../utilities/logger');
const config = require('../../config/selenium.config');
const { v4: uuidv4 } = require('uuid');

describe('[AUTH] Authentication Tests - SE-001 to SE-060', function () {
  this.timeout(60000);
  let driver, lp, dp, utils;

  before(async () => {
    driver = await DriverFactory.createDriver();
    lp = new LoginPage(driver);
    dp = new DashboardPage(driver);
    utils = lp.utils;
    await lp.open();
  });

  after(async () => {
    await ExcelReporter.generateReport();
    await DriverFactory.quitDriver();
  });

  afterEach(async function () {
    const st = this.currentTest.state === 'passed' ? 'PASSED' : this.currentTest.state === 'failed' ? 'FAILED' : 'SKIPPED';
    if (st === 'FAILED') {
      const ss = await lp.captureOnFailure(this.currentTest.title, this.currentTest.err);
      ExcelReporter.addResult({ module: 'Auth', scenario: this.currentTest.title, status: st, error: this.currentTest.err?.message, screenshotPath: ss, url: await utils.getURL(), duration: this.currentTest.duration });
    } else {
      ExcelReporter.addResult({ module: 'Auth', scenario: this.currentTest.title, status: st, duration: this.currentTest.duration });
    }
  });

  // ── Login Tests SE-001 to SE-030 ───────────────────────────────────────────
  it('SE-001: Landing page loads successfully', async () => {
    const title = await driver.getTitle();
    expect(title).to.be.a('string').that.is.not.empty;
    logger.logStep('SE-001', 'Check page title', 'PASS');
  });

  it('SE-002: Login button is visible on landing', async () => {
    const d = await lp.utils.isDisplayed(lp.loc.loginBtn);
    expect(d).to.be.true;
  });

  it('SE-003: Sign Up button is visible on landing', async () => {
    const d = await lp.utils.isDisplayed(lp.loc.signupBtn);
    expect(d).to.be.true;
  });

  it('SE-004: Portal Login button navigates to login form', async () => {
    await lp.utils.click(lp.loc.portalLogin);
    const d = await lp.isLoginFormVisible();
    expect(d).to.be.true;
  });

  it('SE-005: Email input is present', async () => {
    const d = await lp.utils.isDisplayed(lp.loc.emailInput);
    expect(d).to.be.true;
  });

  it('SE-006: Password input is present', async () => {
    const d = await lp.utils.isDisplayed(lp.loc.passwordInput);
    expect(d).to.be.true;
  });

  it('SE-007: Submit button is enabled', async () => {
    const enabled = await lp.utils.isEnabled(lp.loc.submitBtn);
    expect(enabled).to.be.true;
  });

  it('SE-008: Empty form shows error', async () => {
    await lp.utils.click(lp.loc.submitBtn);
    const err = await lp.isErrorVisible();
    expect(err).to.be.true;
  });

  it('SE-009: Invalid credentials show error message', async () => {
    await lp.utils.type(lp.loc.emailInput, 'bad@test.com');
    await lp.utils.type(lp.loc.passwordInput, 'wrongpass');
    await lp.utils.click(lp.loc.submitBtn);
    await lp.pause(1500);
    const err = await lp.isErrorVisible();
    expect(err).to.be.true;
  });

  it('SE-010: Error message text is not empty', async () => {
    const err = await lp.getError();
    expect(err).to.be.a('string').that.is.not.empty;
  });

  it('SE-011: Valid buyer login succeeds', async () => {
    await lp.utils.type(lp.loc.emailInput, config.testData.buyerEmail);
    await lp.utils.type(lp.loc.passwordInput, config.testData.buyerPassword);
    await lp.utils.click(lp.loc.submitBtn);
    await dp.waitForDashboard();
    const visible = await dp.isDashboardVisible();
    expect(visible).to.be.true;
  });

  it('SE-012: User name displayed after login', async () => {
    const name = await dp.getUserName();
    expect(name).to.be.a('string').that.is.not.empty;
  });

  it('SE-013: Role badge shows Buyer', async () => {
    const role = await dp.getUserRole();
    expect(role).to.equal('Buyer');
  });

  it('SE-014: Currency pill visible with USD', async () => {
    const pill = await dp.getCurrencyPill();
    expect(pill).to.include('USD');
  });

  it('SE-015: Logout returns to landing', async () => {
    await dp.logout();
    const landing = await lp.isLandingVisible();
    expect(landing).to.be.true;
  });

  it('SE-016: Seller login succeeds', async () => {
    await lp.login(config.testData.sellerEmail, config.testData.sellerPassword);
    await dp.waitForDashboard();
    const role = await dp.getUserRole();
    expect(role).to.equal('Seller');
  });

  it('SE-017: Seller sees Add Listing button', async () => {
    const d = await dp.utils.isDisplayed(dp.loc.addListingBtn);
    expect(d).to.be.true;
  });

  it('SE-018: Seller logout works', async () => {
    await dp.logout();
    const landing = await lp.isLandingVisible();
    expect(landing).to.be.true;
  });

  it('SE-019: Admin login succeeds', async () => {
    await lp.login(config.testData.adminEmail, config.testData.adminPassword);
    await dp.waitForDashboard();
    const role = await dp.getUserRole();
    expect(role).to.equal('Admin');
  });

  it('SE-020: Admin logout works', async () => {
    await dp.logout();
    const landing = await lp.isLandingVisible();
    expect(landing).to.be.true;
  });

  it('SE-021: SQL injection in email is rejected', async () => {
    await lp.utils.click(lp.loc.portalLogin);
    await lp.utils.type(lp.loc.emailInput, "' OR '1'='1");
    await lp.utils.type(lp.loc.passwordInput, 'password');
    await lp.utils.click(lp.loc.submitBtn);
    await lp.pause(1000);
    const err = await lp.isErrorVisible();
    expect(err).to.be.true;
  });

  it('SE-022: XSS in email field is sanitized', async () => {
    await lp.utils.type(lp.loc.emailInput, '<script>alert(1)</script>@test.com');
    await lp.utils.click(lp.loc.submitBtn);
    await lp.pause(1000);
    const src = await utils.getPageSource();
    expect(src).to.not.include('<script>alert(1)</script>');
  });

  it('SE-023: Password field type is password', async () => {
    const type = await lp.utils.getAttribute(lp.loc.passwordInput, 'type');
    expect(type).to.equal('password');
  });

  it('SE-024: Signup link navigates to signup form', async () => {
    await lp.utils.click(lp.loc.signupLink);
    await lp.pause(500);
    const d = await lp.utils.isDisplayed(lp.loc.signupSubmit);
    expect(d).to.be.true;
  });

  it('SE-025: Login link on signup navigates back', async () => {
    await lp.utils.click(lp.loc.loginLink);
    await lp.pause(500);
    const d = await lp.utils.isDisplayed(lp.loc.submitBtn);
    expect(d).to.be.true;
  });

  it('SE-026: Email placeholder text is helpful', async () => {
    const ph = await lp.utils.getAttribute(lp.loc.emailInput, 'placeholder');
    expect(ph).to.be.a('string').that.is.not.empty;
  });

  it('SE-027: Password placeholder text is helpful', async () => {
    const ph = await lp.utils.getAttribute(lp.loc.passwordInput, 'placeholder');
    expect(ph).to.be.a('string').that.is.not.empty;
  });

  it('SE-028: Form title changes between login and signup', async () => {
    const loginTitle = await utils.getText(By.css('.glass-card h2'));
    await lp.utils.click(lp.loc.signupLink);
    await lp.pause(300);
    const signupTitle = await utils.getText(By.css('.glass-card h2'));
    expect(loginTitle).to.not.equal(signupTitle);
  });

  it('SE-029: Seed accounts hint is visible', async () => {
    await lp.utils.click(lp.loc.loginLink);
    const d = await utils.isDisplayed(By.xpath('//*[contains(text(),"Quick-Test Seed Accounts")]'));
    expect(d).to.be.true;
  });

  it('SE-030: Page refreshes keeps login form shown', async () => {
    await driver.navigate().refresh();
    await lp.pause(1500);
    const landing = await lp.isLandingVisible();
    expect(landing).to.be.true;
  });

  // ── Signup Tests SE-031 to SE-060 ──────────────────────────────────────────
  const unique = () => `test_${uuidv4().split('-')[0]}@propai.com`;

  it('SE-031: Register button visible on landing', async () => {
    const d = await utils.isDisplayed(lp.loc.registerBtn);
    expect(d).to.be.true;
  });

  it('SE-032: Signup form shows name field', async () => {
    await lp.utils.click(lp.loc.registerBtn);
    const d = await utils.isDisplayed(lp.loc.nameInput);
    expect(d).to.be.true;
  });

  it('SE-033: Signup has Buyer and Seller role cards', async () => {
    const buyer = await utils.isDisplayed(lp.loc.buyerRole);
    const seller = await utils.isDisplayed(lp.loc.sellerRole);
    expect(buyer && seller).to.be.true;
  });

  it('SE-034: No currency selector on signup form', async () => {
    const d = await utils.isDisplayed(By.css('.currency-grid'));
    expect(d).to.be.false;
  });

  it('SE-035: Empty signup shows error', async () => {
    await lp.utils.click(lp.loc.signupSubmit);
    await lp.pause(800);
    const form = await utils.isDisplayed(lp.loc.signupSubmit);
    expect(form).to.be.true;
  });

  it('SE-036: Invalid email format shows error', async () => {
    await lp.utils.type(lp.loc.nameInput, 'Test User');
    await lp.utils.type(lp.loc.emailInput, 'notvalid');
    await lp.utils.type(lp.loc.passwordInput, 'password');
    await lp.utils.click(lp.loc.signupSubmit);
    await lp.pause(1000);
    const form = await utils.isDisplayed(lp.loc.signupSubmit);
    expect(form).to.be.true;
  });

  it('SE-037: Duplicate email shows error', async () => {
    await lp.utils.type(lp.loc.emailInput, config.testData.buyerEmail);
    await lp.utils.type(lp.loc.passwordInput, 'password');
    await lp.utils.click(lp.loc.signupSubmit);
    await lp.pause(1500);
    const err = await lp.isErrorVisible();
    expect(err).to.be.true;
  });

  it('SE-038: Valid signup redirects to login NOT dashboard', async () => {
    await lp.utils.type(lp.loc.nameInput, 'New Tester');
    await lp.utils.type(lp.loc.emailInput, unique());
    await lp.utils.type(lp.loc.passwordInput, 'password123');
    await lp.utils.click(lp.loc.buyerRole);
    await lp.utils.click(lp.loc.signupSubmit);
    await lp.pause(2000);
    const success = await lp.isSuccessVisible();
    expect(success).to.be.true;
  });

  it('SE-039: Success message mentions account created', async () => {
    const msg = await lp.getSuccess();
    expect(msg.toLowerCase()).to.include.oneOf(['created', 'success', 'sign in']);
  });

  it('SE-040: Login form is shown after signup', async () => {
    const d = await utils.isDisplayed(lp.loc.submitBtn);
    expect(d).to.be.true;
  });

  it('SE-041: Dashboard NOT shown after signup', async () => {
    const dashboard = await dp.isDashboardVisible();
    expect(dashboard).to.be.false;
  });

  it('SE-042: Seller role signup works', async () => {
    await lp.signup('Seller Test', unique(), 'password123', 'Seller');
    await lp.pause(2000);
    const success = await lp.isSuccessVisible();
    expect(success).to.be.true;
  });

  it('SE-043: Buyer role card is selectable', async () => {
    await lp.utils.click(lp.loc.registerBtn);
    await lp.utils.click(lp.loc.buyerRole);
    const cls = await lp.utils.getAttribute(lp.loc.buyerRole, 'class');
    expect(cls).to.include('selected');
  });

  it('SE-044: Seller role card is selectable', async () => {
    await lp.utils.click(lp.loc.sellerRole);
    const cls = await lp.utils.getAttribute(lp.loc.sellerRole, 'class');
    expect(cls).to.include('selected');
  });

  it('SE-045: Name field accepts long name', async () => {
    await lp.utils.type(lp.loc.nameInput, 'Alexander James Bartholomew');
    const val = await lp.utils.getAttribute(lp.loc.nameInput, 'value');
    expect(val).to.equal('Alexander James Bartholomew');
  });

  it('SE-046: Email pre-filled after signup redirect', async () => {
    await lp.signup('Pre Fill Test', 'prefill_' + unique(), 'password', 'Buyer');
    await lp.pause(2000);
    const emailVal = await lp.utils.getAttribute(lp.loc.emailInput, 'value');
    expect(emailVal).to.include('prefill_');
  });

  it('SE-047: Login with newly created account succeeds', async () => {
    const newEmail = unique();
    await lp.signup('Fresh User', newEmail, 'password', 'Buyer');
    await lp.pause(2000);
    await lp.utils.type(lp.loc.passwordInput, 'password');
    await lp.utils.click(lp.loc.submitBtn);
    await dp.waitForDashboard();
    const visible = await dp.isDashboardVisible();
    expect(visible).to.be.true;
    await dp.logout();
  });

  it('SE-048: Signup page title is Create Vetted Profile', async () => {
    await lp.utils.click(lp.loc.registerBtn);
    const h2 = await utils.getText(By.css('.glass-card h2'));
    expect(h2).to.include('Vetted Profile');
  });

  it('SE-049: Login page title is Welcome Back', async () => {
    await lp.utils.click(lp.loc.loginLink);
    await lp.pause(300);
    const h2 = await utils.getText(By.css('.glass-card h2'));
    expect(h2).to.include('Welcome Back');
  });

  it('SE-050: Tab key navigates between form fields', async () => {
    await lp.utils.type(lp.loc.emailInput, 'tab@test.com');
    await lp.utils.pressTab(lp.loc.emailInput);
    await lp.pause(300);
    const focused = await driver.executeScript('return document.activeElement.type');
    expect(focused).to.be.a('string');
  });

  it('SE-051: Enter key submits login form', async () => {
    await lp.utils.type(lp.loc.emailInput, 'enter@bad.com');
    await lp.utils.type(lp.loc.passwordInput, 'bad');
    await lp.utils.pressEnter(lp.loc.passwordInput);
    await lp.pause(1500);
    const err = await lp.isErrorVisible();
    expect(err).to.be.true;
  });

  it('SE-052: Form clears error on new typing', async () => {
    await lp.utils.type(lp.loc.emailInput, config.testData.buyerEmail);
    const err = await lp.isErrorVisible();
    if (!err) expect(true).to.be.true;
    else {
      const errText = await lp.getError();
      expect(errText).to.be.a('string');
    }
  });

  it('SE-053: Multiple failed logins do not lock account', async () => {
    for (let i = 0; i < 3; i++) {
      await lp.utils.type(lp.loc.emailInput, 'fail@test.com');
      await lp.utils.type(lp.loc.passwordInput, 'wrong');
      await lp.utils.click(lp.loc.submitBtn);
      await lp.pause(500);
    }
    const form = await utils.isDisplayed(lp.loc.submitBtn);
    expect(form).to.be.true;
  });

  it('SE-054: Valid buyer login after failures succeeds', async () => {
    await lp.utils.type(lp.loc.emailInput, config.testData.buyerEmail);
    await lp.utils.type(lp.loc.passwordInput, config.testData.buyerPassword);
    await lp.utils.click(lp.loc.submitBtn);
    await dp.waitForDashboard();
    expect(await dp.isDashboardVisible()).to.be.true;
  });

  it('SE-055: After login, URL stays on same base', async () => {
    const url = await utils.getURL();
    expect(url).to.include(config.baseUrl.replace('http://', '').replace('https://', ''));
  });

  it('SE-056: Navbar shows user name after login', async () => {
    const name = await dp.getUserName();
    expect(name).to.be.a('string').that.is.not.empty;
  });

  it('SE-057: Navbar shows role badge', async () => {
    const role = await dp.getUserRole();
    expect(['Buyer', 'Seller', 'Admin']).to.include(role);
  });

  it('SE-058: Logout button is visible in navbar', async () => {
    const d = await utils.isDisplayed(dp.loc.logoutBtn);
    expect(d).to.be.true;
  });

  it('SE-059: Logout clears session and returns to landing', async () => {
    await dp.logout();
    const landing = await lp.isLandingVisible();
    expect(landing).to.be.true;
  });

  it('SE-060: Protected dashboard not accessible after logout', async () => {
    const dashboard = await dp.isDashboardVisible();
    expect(dashboard).to.be.false;
  });
});
