const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class LoginPage extends BasePage {
  get loc() {
    return {
      loginBtn:     By.xpath('//button[contains(text(),"Login")]'),
      signupBtn:    By.xpath('//button[contains(text(),"Sign Up")]'),
      emailInput:   By.css('input[type="email"]'),
      passwordInput:By.css('input[type="password"]'),
      phoneInput:   By.css('input[type="tel"]'),
      submitBtn:    By.xpath('//button[contains(text(),"Sign In to Portal")]'),
      signupSubmit: By.xpath('//button[contains(text(),"Register New Vetted Profile")]'),
      nameInput:    By.css('input[placeholder*="John Doe"], input[placeholder*="Name"]'),
      errorBox:     By.css('[style*="error"], [style*="FCA5A5"]'),
      successBox:   By.css('[style*="success"], [style*="10B981"]'),
      roleCard:     (role) => By.xpath(`//*[@class[contains(.,"role-card")]][.//*[text()="${role}"]]`),
      signupLink:   By.xpath('//*[text()="Sign Up"]'),
      loginLink:    By.xpath('//*[text()="Log In"]'),
      buyerRole:    By.xpath('//*[contains(@class,"role-card") and .//*[text()="Buyer"]]'),
      sellerRole:   By.xpath('//*[contains(@class,"role-card") and .//*[text()="Seller"]]'),
      portalLogin:  By.xpath('//button[contains(text(),"Portal Login")]'),
      registerBtn:  By.xpath('//button[contains(text(),"Register Vetted Account")]')
    };
  }

  async open() { await this.navigate('/'); }

  async clickLogin() { await this.utils.click(this.loc.loginBtn); }
  async clickSignUp() { await this.utils.click(this.loc.signupBtn); }

  async login(email, password) {
    await this.utils.click(this.loc.portalLogin);
    await this.utils.type(this.loc.emailInput, email);
    await this.utils.type(this.loc.passwordInput, password);
    await this.utils.click(this.loc.submitBtn);
  }

  async signup(name, email, password, role = 'Buyer') {
    await this.utils.click(this.loc.registerBtn);
    await this.utils.type(this.loc.nameInput, name);
    await this.utils.type(this.loc.emailInput, email);
    await this.utils.type(this.loc.passwordInput, password);
    await this.utils.click(this.loc.roleCard(role));
    await this.utils.click(this.loc.signupSubmit);
  }

  async getError() { return this.utils.getText(this.loc.errorBox); }
  async getSuccess() { return this.utils.getText(this.loc.successBox); }
  async isErrorVisible() { return this.utils.isDisplayed(this.loc.errorBox); }
  async isSuccessVisible() { return this.utils.isDisplayed(this.loc.successBox); }
  async isLoginFormVisible() { return this.utils.isDisplayed(this.loc.emailInput); }
  async isLandingVisible() { return this.utils.isDisplayed(this.loc.portalLogin); }
}

module.exports = LoginPage;
