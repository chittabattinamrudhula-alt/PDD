const BasePage = require('./BasePage');

class ProfilePage extends BasePage {
  get selectors() {
    return {
      profileTab:       '~profile-tab',
      pageTitle:        'android=new UiSelector().text("My Profile")',
      avatarInitial:    '~profile-avatar',
      userEmail:        '~profile-email',
      userId:           '~profile-user-id',
      displayCurrency:  '~profile-currency',
      currencyGrid:     '~currency-grid',
      signOutBtn:       'android=new UiSelector().text("Sign Out of Portal")',
      rateTable:        '~rate-table',
      currencyCard:     (code) => `~currency-card-${code}`
    };
  }

  async waitForPage() {
    await this.waitForText('My Profile');
  }

  async selectCurrency(code) {
    await this.click(this.selectors.currencyCard(code));
  }

  async getDisplayCurrency() {
    return this.getText(this.selectors.displayCurrency);
  }

  async signOut() {
    await this.click(this.selectors.signOutBtn);
  }

  async getUserEmail() {
    return this.getText(this.selectors.userEmail);
  }
}

module.exports = ProfilePage;
