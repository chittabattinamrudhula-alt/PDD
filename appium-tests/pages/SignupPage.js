const BasePage = require('./BasePage');

class SignupPage extends BasePage {
  get selectors() {
    return {
      registerBtn:      'android=new UiSelector().text("Register Vetted Account")',
      nameInput:        '~signup-name-input',
      emailInput:       '~signup-email-input',
      passwordInput:    '~signup-password-input',
      buyerRole:        '~role-buyer',
      sellerRole:       '~role-seller',
      submitBtn:        'android=new UiSelector().text("Register New Vetted Profile")',
      errorMessage:     '~auth-error',
      successMessage:   '~auth-success',
      loginLink:        '~login-link'
    };
  }

  async navigateToSignup() {
    await this.click(this.selectors.registerBtn);
  }

  async fillName(name) {
    await this.typeText(this.selectors.nameInput, name);
  }

  async fillEmail(email) {
    await this.typeText(this.selectors.emailInput, email);
  }

  async fillPassword(password) {
    await this.typeText(this.selectors.passwordInput, password);
  }

  async selectRole(role) {
    const sel = role === 'Seller' ? this.selectors.sellerRole : this.selectors.buyerRole;
    await this.click(sel);
  }

  async submit() {
    await this.click(this.selectors.submitBtn);
  }

  async signup(name, email, password, role = 'Buyer') {
    await this.fillName(name);
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.selectRole(role);
    await this.submit();
  }

  async getSuccessMessage() {
    return this.getText(this.selectors.successMessage);
  }

  async getErrorMessage() {
    return this.getText(this.selectors.errorMessage);
  }

  async isSuccessDisplayed() {
    return this.isDisplayed(this.selectors.successMessage);
  }
}

module.exports = SignupPage;
