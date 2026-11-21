'use strict';
const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class AuthPage extends BasePage {
  get loc() {
    return {
      // Login
      emailInput:    By.css('input[type="email"]'),
      passwordInput: By.css('input[type="password"]'),
      signInBtn:     By.xpath('//button[contains(text(),"Sign In to Portal")]'),
      portalLogin:   By.xpath('//button[contains(text(),"Portal Login")]'),

      // Signup
      nameInput:     By.css('input[placeholder*="John Doe"], input[placeholder*="Name"], input[type="text"]'),
      phoneInput:    By.css('input[type="tel"]'),
      registerBtn:   By.xpath('//button[contains(text(),"Register Vetted Account")]'),
      signupSubmit:  By.xpath('//button[contains(text(),"Register New Vetted Profile")]'),
      buyerCard:     By.xpath('//*[contains(@class,"role-card") and .//*[text()="Buyer"]]'),
      sellerCard:    By.xpath('//*[contains(@class,"role-card") and .//*[text()="Seller"]]'),

      // Feedback
      errorBox:      By.css('[style*="FCA5A5"], [style*="error"]'),
      successBox:    By.css('[style*="10B981"], [style*="success"]'),

      // Form headings
      loginHeading:  By.xpath('//*[contains(text(),"Welcome Back")]'),
      signupHeading: By.xpath('//*[contains(text(),"Create Vetted Profile")]'),
      loginSubtitle: By.xpath('//*[contains(text(),"analytics vault")]'),

      // Links
      signupLink:    By.xpath('//*[text()="Sign Up"]'),
      loginLink:     By.xpath('//*[contains(text(),"Log In")]'),

      // Seed hints
      seedHints:     By.xpath('//*[contains(text(),"Quick-Test Seed")]'),
    };
  }

  // ── Open forms ───────────────────────────────────────────────────────────
  async openLoginForm() {
    const isVisible = await this.w.isDisplayed(this.loc.signInBtn);
    if (!isVisible) {
      await this.w.click(this.loc.portalLogin);
      await this.w.waitForElement(this.loc.signInBtn);
    }
  }

  async openSignupForm() {
    const isVisible = await this.w.isDisplayed(this.loc.signupSubmit);
    if (!isVisible) {
      const registerVisible = await this.w.isDisplayed(this.loc.registerBtn);
      if (registerVisible) {
        await this.w.click(this.loc.registerBtn);
      } else {
        await this.w.click(this.loc.signupLink);
      }
      await this.w.waitForElement(this.loc.signupSubmit);
    }
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  async login(email, password) {
    await this.openLoginForm();
    await this.w.type(this.loc.emailInput, email);
    await this.w.type(this.loc.passwordInput, password);
    await this.w.click(this.loc.signInBtn);
    await this.w.pause(1500);
  }

  // ── Signup ────────────────────────────────────────────────────────────────
  async signup(name, email, phone, password, role = 'Buyer') {
    await this.openSignupForm();
    const nameInputs = await this.driver.findElements(By.css('input[type="text"]'));
    if (nameInputs.length > 0) { await nameInputs[0].clear(); await nameInputs[0].sendKeys(name); }
    await this.w.type(this.loc.emailInput, email);
    const telInputs = await this.driver.findElements(By.css('input[type="tel"]'));
    if (telInputs.length > 0) { await telInputs[0].clear(); await telInputs[0].sendKeys(phone); }
    await this.w.type(this.loc.passwordInput, password);
    if (role === 'Seller') {
      await this.w.click(this.loc.sellerCard);
    } else {
      await this.w.click(this.loc.buyerCard);
    }
    await this.w.click(this.loc.signupSubmit);
    await this.w.pause(1500);
  }

  // ── Queries ───────────────────────────────────────────────────────────────
  async isLoginFormVisible()  { return this.w.isDisplayed(this.loc.signInBtn); }
  async isSignupFormVisible() { return this.w.isDisplayed(this.loc.signupSubmit); }
  async isErrorVisible()      { return this.w.isDisplayed(this.loc.errorBox); }
  async isSuccessVisible()    { return this.w.isDisplayed(this.loc.successBox); }
  async getErrorText()        { return this.w.getText(this.loc.errorBox).catch(() => ''); }
  async getSuccessText()      { return this.w.getText(this.loc.successBox).catch(() => ''); }
}

module.exports = AuthPage;
