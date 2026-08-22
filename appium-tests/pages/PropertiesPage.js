const BasePage = require('./BasePage');

class PropertiesPage extends BasePage {
  get selectors() {
    return {
      pageTitle:        'android=new UiSelector().text("Property Register Explorer")',
      propertyCards:    '~property-card',
      firstCard:        '~property-card-0',
      verifiedBadge:    '~badge-verified',
      unverifiedBadge:  '~badge-unverified',
      bookedBadge:      '~badge-booked',
      anomalyBadge:     '~badge-anomaly',
      inspectBtn:       'android=new UiSelector().text("Inspect Vetting")',
      modalOverlay:     '~modal-overlay',
      modalClose:       'android=new UiSelector().text("✕ Close")',
      bookBtn:          'android=new UiSelector().text("Book Property (Escrow Reservation)")',
      alreadyBooked:    'android=new UiSelector().text("Already Reserved")',
      propertyTitle:    '~modal-property-title',
      propertyPrice:    '~modal-property-price',
      appraisalValue:   '~modal-appraisal-value',
      verifyDeedBtn:    'android=new UiSelector().text("Verify Deed On-Chain")',
      clearAnomalyBtn:  'android=new UiSelector().text("Clear Anomalies")'
    };
  }

  async waitForPage() {
    await this.waitForText('Property Register Explorer');
  }

  async getPropertyCount() {
    const cards = await this.driver.$$('~property-card');
    return cards.length;
  }

  async openProperty(index = 0) {
    await this.click(`~property-card-${index}`);
  }

  async closeModal() {
    await this.click(this.selectors.modalClose);
  }

  async bookProperty() {
    await this.click(this.selectors.bookBtn);
  }

  async isModalOpen() {
    return this.isDisplayed(this.selectors.modalOverlay);
  }

  async getPropertyTitle() {
    return this.getText(this.selectors.propertyTitle);
  }

  async getPropertyPrice() {
    return this.getText(this.selectors.propertyPrice);
  }
}

module.exports = PropertiesPage;
