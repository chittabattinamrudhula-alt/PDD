const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class ProfilePage extends BasePage {
  get loc() {
    return {
      pageTitle:    By.xpath('//*[text()="My Profile"]'),
      avatar:       By.css('.profile-avatar'),
      currencyGrid: By.css('.currency-grid'),
      signOutBtn:   By.xpath('//button[contains(text(),"Sign Out")]'),
      currencyCard: (code) => By.xpath(`//*[contains(@class,"currency-card") and .//*[text()="${code}"]]`),
      rateTable:    By.xpath('//*[contains(text(),"Live Rate")]'),
      userEmail:    By.xpath('//*[contains(@class,"profile-info-value") and contains(text(),"@")]')
    };
  }

  async waitForPage() { await this.utils.waitForText('My Profile'); }
  async selectCurrency(code) { await this.utils.click(this.loc.currencyCard(code)); await this.pause(600); }
  async signOut() { await this.utils.click(this.loc.signOutBtn); }
  async isPageVisible() { return this.utils.isDisplayed(this.loc.pageTitle); }
  async getUserEmail() { return this.utils.getText(this.loc.userEmail); }
}

module.exports = ProfilePage;
