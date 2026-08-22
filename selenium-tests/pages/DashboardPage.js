const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class DashboardPage extends BasePage {
  get loc() {
    return {
      navDashboard:   By.xpath('//button[contains(text(),"Dashboard")]'),
      navProperties:  By.xpath('//button[contains(text(),"Explore")]'),
      navValuation:   By.xpath('//button[contains(text(),"AI Valuation")]'),
      navLedger:      By.xpath('//button[contains(text(),"Ledger")]'),
      navBookings:    By.xpath('//button[normalize-space()="My Bookings" or normalize-space()="Sales Ledger" or normalize-space()="Global Bookings"]'),
      navProfile:     By.xpath('//button[contains(text(),"Profile")]'),
      logoutBtn:      By.xpath('//button[contains(text(),"Logout")]'),
      addListingBtn:  By.xpath('//button[contains(text(),"Add Listing")]'),
      currencyPill:   By.css('.currency-pill'),
      userRoleBadge:  By.css('.role-indicator'),
      userName:       By.css('.user-profile-badge span:last-child'),
      statListings:   By.xpath('//*[contains(text(),"Database Listings")]/following-sibling::*//span[1]'),
      statVerified:   By.xpath('//*[contains(text(),"Blockchain Title Deeds")]/following-sibling::*//span[1]'),
      statBookings:   By.xpath('//*[contains(text(),"System Bookings")]/following-sibling::*//span[1]'),
      trendChart:     By.css('.trend-svg, svg'),
      locationSelect: By.css('select'),
      launchEstimator:By.xpath('//button[contains(text(),"Launch AI Estimator")]'),
      propCards:      By.css('.property-card'),
      propAILogo:     By.css('.nav-logo')
    };
  }

  async navigateTo(tab) {
    const map = {
      dashboard: this.loc.navDashboard,
      properties: this.loc.navProperties,
      valuation: this.loc.navValuation,
      ledger: this.loc.navLedger,
      bookings: this.loc.navBookings,
      profile: this.loc.navProfile
    };
    await this.utils.click(map[tab]);
    await this.pause(500);
  }

  async waitForDashboard() { await this.utils.waitForElement(this.loc.navDashboard, 30000); }
  async logout() { await this.utils.click(this.loc.logoutBtn); }
  async getUserName() { return this.utils.getText(this.loc.userName); }
  async getUserRole() { return this.utils.getText(this.loc.userRoleBadge); }
  async getCurrencyPill() { return this.utils.getText(this.loc.currencyPill); }

  async getPropertyCount() {
    const cards = await this.driver.findElements(this.loc.propCards);
    return cards.length;
  }

  async openPropertyCard(index = 0) {
    const cards = await this.driver.findElements(this.loc.propCards);
    await cards[index].click();
  }

  async selectLocation(loc) {
    const sel = await this.utils.waitForElement(this.loc.locationSelect);
    const { Select } = require('selenium-webdriver');
    const s = new (require('selenium-webdriver/lib/select').Select)(sel);
    await s.selectByVisibleText(loc).catch(() => sel.sendKeys(loc));
  }

  async isDashboardVisible() { return this.utils.isDisplayed(this.loc.navDashboard); }
}

module.exports = DashboardPage;
