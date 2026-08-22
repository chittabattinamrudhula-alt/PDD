const BasePage = require('./BasePage');

class LoginPage extends BasePage {
  get selectors() {
    return {
      emailInput:       '~email-input',
      passwordInput:    '~password-input',
      loginButton:      '~login-button',
      signupLink:       '~signup-link',
      errorMessage:     '~auth-error',
      welcomeText:      '~welcome-text',
      portalLoginBtn:   'android=new UiSelector().text("Portal Login")',
      signInBtn:        'android=new UiSelector().text("Sign In to Portal")',
      dashboardTab:     '~dashboard-tab',
      forgotPassword:   '~forgot-password'
    };
  }

  async navigateToLogin() {
    await this.click(this.selectors.portalLoginBtn);
  }

  async enterEmail(email) {
    await this.typeText(this.selectors.emailInput, email);
  }

  async enterPassword(password) {
    await this.typeText(this.selectors.passwordInput, password);
  }

  async tapLogin() {
    await this.click(this.selectors.loginButton);
  }

  async login(email, password) {
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.tapLogin();
  }

  async getErrorMessage() {
    return this.getText(this.selectors.errorMessage);
  }

  async isLoginPageDisplayed() {
    return this.isDisplayed(this.selectors.loginButton);
  }

  async isDashboardDisplayed() {
    return this.isDisplayed(this.selectors.dashboardTab);
  }

  async tapSignupLink() {
    await this.click(this.selectors.signupLink);
  }
}

module.exports = LoginPage;
