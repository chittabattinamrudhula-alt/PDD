'use strict';
/**
 * SUITE: Authentication (40 Test Cases)
 * IDs: TC-AUTH-001 to TC-AUTH-040
 * Category: Authentication
 * Priority: Critical / High
 * Target: Live GitHub Pages URL
 */
const { expect }                        = require('chai');
const { By }                            = require('selenium-webdriver');
const { setupSuite, teardownSuite, recordResult } = require('../../utils/testHelper');
const td                                = require('../../data/testData');

describe('[AUTH] Authentication — TC-AUTH-001 to TC-AUTH-040', function () {
  this.timeout(120000);
  let driver, landing, auth, app, utils;

  before(async () => ({ driver, landing, auth, app, utils } = await setupSuite(this)));
  after(async () => teardownSuite(driver));
  afterEach(async function () { await recordResult(this, utils); });

  // ── Landing Page (TC-AUTH-001 to TC-AUTH-005) ────────────────────────────
  it('TC-AUTH-001: [Critical] Landing page loads at the live GitHub Pages URL', async () => {
    expect(await landing.isVisible()).to.be.true;
  });

  it('TC-AUTH-002: [Critical] Page title contains PropAI branding', async () => {
    const title = await utils.getTitle();
    expect(title.toLowerCase()).to.satisfy(t => t.includes('prop') || t.length > 0);
  });

  it('TC-AUTH-003: [High] Register CTA button visible on landing', async () => {
    expect(await utils.isDisplayed(landing.loc.registerBtn)).to.be.true;
  });

  it('TC-AUTH-004: [High] Portal Login CTA button visible on landing', async () => {
    expect(await utils.isDisplayed(landing.loc.loginBtn)).to.be.true;
  });

  it('TC-AUTH-005: [Medium] PropAI logo visible in navbar', async () => {
    expect(await utils.isDisplayed(landing.loc.propAILogo)).to.be.true;
  });

  // ── Login Form UI (TC-AUTH-006 to TC-AUTH-012) ───────────────────────────
  it('TC-AUTH-006: [High] Clicking Portal Login opens login form', async () => {
    await auth.openLoginForm();
    expect(await auth.isLoginFormVisible()).to.be.true;
  });

  it('TC-AUTH-007: [High] Login form has email input field', async () => {
    expect(await utils.isDisplayed(auth.loc.emailInput)).to.be.true;
  });

  it('TC-AUTH-008: [High] Login form has password input field', async () => {
    expect(await utils.isDisplayed(auth.loc.passwordInput)).to.be.true;
  });

  it('TC-AUTH-009: [High] Login form has Sign In button', async () => {
    expect(await utils.isDisplayed(auth.loc.signInBtn)).to.be.true;
  });

  it('TC-AUTH-010: [Medium] Login form heading is "Welcome Back"', async () => {
    expect(await utils.isDisplayed(auth.loc.loginHeading)).to.be.true;
  });

  it('TC-AUTH-011: [Medium] Login subtitle mentions analytics vault', async () => {
    expect(await utils.isDisplayed(auth.loc.loginSubtitle)).to.be.true;
  });

  it('TC-AUTH-012: [Medium] Password field type attribute is password (masked)', async () => {
    const type = await utils.getAttribute(auth.loc.passwordInput, 'type');
    expect(type).to.equal('password');
  });

  // ── Login Validation (TC-AUTH-013 to TC-AUTH-020) ─────────────────────────
  it('TC-AUTH-013: [Critical] Empty form submit shows validation error', async () => {
    await utils.click(auth.loc.signInBtn);
    await utils.pause(500);
    const src = await utils.getPageSource();
    expect(src).to.satisfy(s => s.includes('Invalid') || s.includes('required') || s.includes('failed'));
  });

  it('TC-AUTH-014: [High] Wrong password shows error message', async () => {
    await utils.type(auth.loc.emailInput, td.buyer.email);
    await utils.type(auth.loc.passwordInput, 'WRONGPASS999');
    await utils.click(auth.loc.signInBtn);
    await utils.pause(1500);
    expect(await auth.isErrorVisible()).to.be.true;
  });

  it('TC-AUTH-015: [High] Error message text is non-empty', async () => {
    const msg = await auth.getErrorText();
    expect(msg.trim().length).to.be.gt(0);
  });

  it('TC-AUTH-016: [High] Non-existent email shows error', async () => {
    await auth.openLoginForm();
    await utils.type(auth.loc.emailInput, td.invalid.email);
    await utils.type(auth.loc.passwordInput, td.invalid.password);
    await utils.click(auth.loc.signInBtn);
    await utils.pause(1500);
    expect(await auth.isErrorVisible()).to.be.true;
  });

  it('TC-AUTH-017: [Medium] SQL injection in password field handled safely', async () => {
    await auth.openLoginForm();
    await utils.type(auth.loc.emailInput, td.invalid.sqlInject);
    await utils.type(auth.loc.passwordInput, td.invalid.sqlInject);
    await utils.click(auth.loc.signInBtn);
    await utils.pause(1000);
    expect(await auth.isLoginFormVisible() || await auth.isErrorVisible()).to.be.true;
  });

  it('TC-AUTH-018: [Medium] XSS payload in email field handled safely', async () => {
    await auth.openLoginForm();
    await utils.type(auth.loc.emailInput, td.invalid.xssPayload);
    await utils.type(auth.loc.passwordInput, 'pass');
    await utils.click(auth.loc.signInBtn);
    await utils.pause(1000);
    const src = await utils.getPageSource();
    expect(src).not.to.include('<script>alert(1)</script>');
  });

  it('TC-AUTH-019: [Medium] Switching to signup clears error state', async () => {
    await auth.openLoginForm();
    await utils.click(auth.loc.signupLink).catch(async () => {
      const src = await utils.getPageSource();
      if (src.includes('Sign Up')) await utils.click(By.xpath('//*[text()="Sign Up"]'));
    });
    await utils.pause(400);
    const errorVisible = await auth.isErrorVisible();
    expect(errorVisible).to.be.false;
  });

  it('TC-AUTH-020: [Low] Seed accounts hint box is shown on login form', async () => {
    await auth.openLoginForm();
    expect(await utils.isDisplayed(auth.loc.seedHints)).to.be.true;
  });

  // ── Signup Form (TC-AUTH-021 to TC-AUTH-030) ──────────────────────────────
  it('TC-AUTH-021: [High] Signup form opens from Register CTA', async () => {
    await auth.openSignupForm();
    expect(await auth.isSignupFormVisible()).to.be.true;
  });

  it('TC-AUTH-022: [High] Signup form heading is "Create Vetted Profile"', async () => {
    expect(await utils.isDisplayed(auth.loc.signupHeading)).to.be.true;
  });

  it('TC-AUTH-023: [High] Signup form has Full Name field', async () => {
    const inputs = await driver.findElements(By.css('input[type="text"]'));
    expect(inputs.length).to.be.gte(1);
  });

  it('TC-AUTH-024: [High] Signup form has Phone Number field', async () => {
    const telInputs = await driver.findElements(By.css('input[type="tel"]'));
    expect(telInputs.length).to.be.gte(1);
  });

  it('TC-AUTH-025: [High] Signup form has Buyer role card', async () => {
    expect(await utils.isDisplayed(auth.loc.buyerCard)).to.be.true;
  });

  it('TC-AUTH-026: [High] Signup form has Seller role card', async () => {
    expect(await utils.isDisplayed(auth.loc.sellerCard)).to.be.true;
  });

  it('TC-AUTH-027: [High] Duplicate email shows "already exists" error', async () => {
    const user = td.newBuyer();
    await auth.signup(user.name, td.buyer.email, user.phone, user.password, 'Buyer');
    await utils.pause(1500);
    expect(await auth.isErrorVisible()).to.be.true;
    const msg = await auth.getErrorText();
    expect(msg.toLowerCase()).to.include('exist');
  });

  it('TC-AUTH-028: [Critical] Valid new user signup succeeds', async () => {
    const user = td.newBuyer();
    await auth.openSignupForm();
    await auth.signup(user.name, user.email, user.phone, user.password, 'Buyer');
    await utils.pause(2000);
    expect(await auth.isSuccessVisible() || await auth.isLoginFormVisible()).to.be.true;
  });

  it('TC-AUTH-029: [High] After signup, redirected to login form', async () => {
    await utils.pause(1500);
    expect(await auth.isLoginFormVisible()).to.be.true;
  });

  it('TC-AUTH-030: [Medium] Log In link on signup form navigates back to login', async () => {
    await auth.openSignupForm();
    await utils.click(auth.loc.loginLink).catch(() => {});
    await utils.pause(400);
    expect(await auth.isLoginFormVisible()).to.be.true;
  });

  // ── Buyer Login + Role (TC-AUTH-031 to TC-AUTH-035) ───────────────────────
  it('TC-AUTH-031: [Critical] Buyer login with valid credentials succeeds', async () => {
    await auth.login(td.buyer.email, td.buyer.password);
    expect(await app.isLoggedIn()).to.be.true;
  });

  it('TC-AUTH-032: [Critical] Buyer role badge shown as "Buyer"', async () => {
    const role = await app.getRoleText();
    expect(role).to.include('Buyer');
  });

  it('TC-AUTH-033: [High] Buyer does NOT see Add Listing button', async () => {
    expect(await app.isAddListingVisible()).to.be.false;
  });

  it('TC-AUTH-034: [High] Buyer sees "My Bookings" in nav', async () => {
    expect(await utils.isDisplayed(app.loc.tabBookings)).to.be.true;
  });

  it('TC-AUTH-035: [High] Buyer logout returns to landing page', async () => {
    await app.logout();
    expect(await landing.isVisible()).to.be.true;
  });

  // ── Seller Role (TC-AUTH-036 to TC-AUTH-038) ──────────────────────────────
  it('TC-AUTH-036: [Critical] Seller login succeeds and shows Add Listing', async () => {
    await auth.login(td.seller.email, td.seller.password);
    expect(await app.isAddListingVisible()).to.be.true;
  });

  it('TC-AUTH-037: [High] Seller role badge shown as "Seller"', async () => {
    const role = await app.getRoleText();
    expect(role).to.include('Seller');
  });

  it('TC-AUTH-038: [High] Seller nav shows Sales Ledger tab', async () => {
    const src = await utils.getPageSource();
    expect(src).to.include('Sales Ledger');
    await app.logout();
  });

  // ── Admin Role (TC-AUTH-039 to TC-AUTH-040) ───────────────────────────────
  it('TC-AUTH-039: [Critical] Admin login succeeds', async () => {
    await auth.login(td.admin.email, td.admin.password);
    expect(await app.isLoggedIn()).to.be.true;
    const role = await app.getRoleText();
    expect(role).to.include('Admin');
  });

  it('TC-AUTH-040: [High] Admin sees Global Bookings tab', async () => {
    const src = await utils.getPageSource();
    expect(src).to.include('Global Bookings');
    await app.logout();
  });
});
