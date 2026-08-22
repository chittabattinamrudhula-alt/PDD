const { expect } = require('chai');
const DriverFactory = require('../../utilities/driverFactory');
const SignupPage = require('../../pages/SignupPage');
const LoginPage = require('../../pages/LoginPage');
const ExcelReporter = require('../../utilities/excelReporter');
const ScreenshotUtils = require('../../utilities/screenshotUtils');
const logger = require('../../utilities/logger');
const { v4: uuidv4 } = require('uuid');

describe('[AUTH] Signup Tests', function () {
  this.timeout(120000);
  let driver, signupPage, loginPage;

  before(async () => {
    driver = await DriverFactory.createDriver();
    signupPage = new SignupPage(driver);
    loginPage = new LoginPage(driver);
  });

  after(async () => { await DriverFactory.quitDriver(); });

  afterEach(async function () {
    const status = this.currentTest.state === 'passed' ? 'PASSED' : this.currentTest.state === 'failed' ? 'FAILED' : 'SKIPPED';
    if (status === 'FAILED') {
      const ss = await ScreenshotUtils.captureOnFailure(driver, this.currentTest.title, this.currentTest.err);
      ExcelReporter.addResult({ module: 'Auth-Signup', scenario: this.currentTest.title, status, error: this.currentTest.err?.message, screenshotPath: ss, duration: this.currentTest.duration });
    } else {
      ExcelReporter.addResult({ module: 'Auth-Signup', scenario: this.currentTest.title, status, duration: this.currentTest.duration });
    }
  });

  const uniqueEmail = () => `testuser_${uuidv4().split('-')[0]}@propai.com`;

  it('TC-031: Register button visible on landing', async () => {
    const displayed = await signupPage.isDisplayed('android=new UiSelector().text("Register Vetted Account")');
    expect(displayed).to.be.true;
  });

  it('TC-032: Signup form has name field', async () => {
    await signupPage.navigateToSignup();
    const displayed = await signupPage.isDisplayed(signupPage.selectors.nameInput);
    expect(displayed).to.be.true;
  });

  it('TC-033: Signup form has email field', async () => {
    const displayed = await signupPage.isDisplayed(signupPage.selectors.emailInput);
    expect(displayed).to.be.true;
  });

  it('TC-034: Signup form has password field', async () => {
    const displayed = await signupPage.isDisplayed(signupPage.selectors.passwordInput);
    expect(displayed).to.be.true;
  });

  it('TC-035: Signup form has role selection', async () => {
    const displayed = await signupPage.isDisplayed(signupPage.selectors.buyerRole);
    expect(displayed).to.be.true;
  });

  it('TC-036: Buyer role is selectable', async () => {
    await signupPage.selectRole('Buyer');
    const attr = await signupPage.getAttribute(signupPage.selectors.buyerRole, 'selected');
    expect(attr).to.be.oneOf(['true', true]);
  });

  it('TC-037: Seller role is selectable', async () => {
    await signupPage.selectRole('Seller');
    const attr = await signupPage.getAttribute(signupPage.selectors.sellerRole, 'selected');
    expect(attr).to.be.oneOf(['true', true]);
  });

  it('TC-038: Empty form submission shows error', async () => {
    await signupPage.submit();
    const err = await signupPage.getErrorMessage();
    expect(err).to.be.a('string').that.is.not.empty;
  });

  it('TC-039: Missing name shows validation error', async () => {
    await signupPage.fillEmail(uniqueEmail());
    await signupPage.fillPassword('password');
    await signupPage.submit();
    const err = await signupPage.getErrorMessage();
    expect(err).to.be.a('string').that.is.not.empty;
  });

  it('TC-040: Invalid email format shows error', async () => {
    await signupPage.fillName('Test User');
    await signupPage.fillEmail('notanemail');
    await signupPage.fillPassword('password');
    await signupPage.submit();
    const err = await signupPage.getErrorMessage();
    expect(err).to.be.a('string').that.is.not.empty;
  });

  it('TC-041: Duplicate email shows error', async () => {
    await signupPage.signup('Dup User', 'buyer@propai.com', 'password', 'Buyer');
    const err = await signupPage.getErrorMessage();
    expect(err).to.include.oneOf(['exists', 'already', 'duplicate', 'registered']);
  });

  it('TC-042: Valid signup redirects to login page', async () => {
    await signupPage.navigateToSignup();
    await signupPage.signup('New User', uniqueEmail(), 'securePass123', 'Buyer');
    const success = await signupPage.isSuccessDisplayed();
    expect(success).to.be.true;
  });

  it('TC-043: Success message contains account created text', async () => {
    const msg = await signupPage.getSuccessMessage();
    expect(msg.toLowerCase()).to.include.oneOf(['created', 'success', 'sign in']);
  });

  it('TC-044: After signup, login form is shown', async () => {
    const displayed = await loginPage.isLoginPageDisplayed();
    expect(displayed).to.be.true;
  });

  it('TC-045: Signup with Seller role works', async () => {
    await signupPage.navigateToSignup();
    await signupPage.signup('Seller User', uniqueEmail(), 'password123', 'Seller');
    const success = await signupPage.isSuccessDisplayed();
    expect(success).to.be.true;
  });

  it('TC-046: Name field accepts unicode characters', async () => {
    await signupPage.navigateToSignup();
    await signupPage.fillName('José María');
    const val = await signupPage.getAttribute(signupPage.selectors.nameInput, 'text');
    expect(val).to.equal('José María');
  });

  it('TC-047: Very short password is rejected', async () => {
    await signupPage.navigateToSignup();
    await signupPage.signup('Test User', uniqueEmail(), '123', 'Buyer');
    const err = await signupPage.getErrorMessage();
    expect(err).to.be.a('string').that.is.not.empty;
  });

  it('TC-048: Login link on signup navigates to login', async () => {
    await signupPage.navigateToSignup();
    await signupPage.click(signupPage.selectors.loginLink);
    const displayed = await loginPage.isLoginPageDisplayed();
    expect(displayed).to.be.true;
  });

  it('TC-049: Signup form is scrollable on small screens', async () => {
    await signupPage.navigateToSignup();
    const gestures = new (require('../../utilities/gestureUtils'))(driver);
    await gestures.scrollDown(2);
    const displayed = await signupPage.isDisplayed(signupPage.selectors.submitBtn);
    expect(displayed).to.be.true;
  });

  it('TC-050: Signup page title is correct', async () => {
    const displayed = await signupPage.isDisplayed('android=new UiSelector().text("Create Vetted Profile")');
    expect(displayed).to.be.true;
  });
});
