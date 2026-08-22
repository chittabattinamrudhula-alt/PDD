const BasePage = require('./BasePage');

class DashboardPage extends BasePage {
  get selectors() {
    return {
      dashboardTab:     '~dashboard-tab',
      propertiesTab:    '~properties-tab',
      valuationTab:     '~valuation-tab',
      ledgerTab:        '~ledger-tab',
      bookingsTab:      '~bookings-tab',
      profileTab:       '~profile-tab',
      totalListings:    '~stat-total-listings',
      totalVerified:    '~stat-verified',
      totalBookings:    '~stat-bookings',
      currencyPill:     '~currency-pill',
      logoutBtn:        '~logout-button',
      addListingBtn:    '~add-listing-button',
      userRoleBadge:    '~user-role-badge',
      userName:         '~user-name',
      featuredSection:  '~featured-listings',
      trendChart:       '~trend-chart',
      locationSelect:   '~location-selector',
      diagnosticsCard:  '~diagnostics-card',
      launchEstimator:  'android=new UiSelector().text("Launch AI Estimator")',
      propertyCard:     '~property-card-0'
    };
  }

  async waitForDashboard() {
    await this.waitForElement(this.selectors.dashboardTab, 30000);
  }

  async navigateTo(tab) {
    const map = {
      dashboard:  this.selectors.dashboardTab,
      properties: this.selectors.propertiesTab,
      valuation:  this.selectors.valuationTab,
      ledger:     this.selectors.ledgerTab,
      bookings:   this.selectors.bookingsTab,
      profile:    this.selectors.profileTab
    };
    await this.click(map[tab]);
  }

  async getTotalListings() {
    return this.getText(this.selectors.totalListings);
  }

  async logout() {
    await this.click(this.selectors.logoutBtn);
  }

  async getUserName() {
    return this.getText(this.selectors.userName);
  }

  async getUserRole() {
    return this.getText(this.selectors.userRoleBadge);
  }

  async getCurrencyCode() {
    return this.getText(this.selectors.currencyPill);
  }

  async isDashboardVisible() {
    return this.isDisplayed(this.selectors.dashboardTab);
  }

  async tapPropertyCard(index = 0) {
    const sel = `~property-card-${index}`;
    await this.click(sel);
  }

  async selectLocation(location) {
    await this.click(this.selectors.locationSelect);
    await this.click(`android=new UiSelector().text("${location}")`);
  }
}

module.exports = DashboardPage;
