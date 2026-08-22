const SeleniumUtils = require('../utilities/seleniumUtils');
const config = require('../config/selenium.config');

class BasePage {
  constructor(driver) {
    this.driver = driver;
    this.utils = new SeleniumUtils(driver);
    this.baseUrl = config.baseUrl;
  }

  async navigate(path = '/') {
    await this.driver.get(`${this.baseUrl}${path}`);
  }

  async getTitle() { return this.utils.getTitle(); }
  async getURL() { return this.utils.getURL(); }
  async pause(ms) { return this.utils.pause(ms); }
  async screenshot(name, type) { return this.utils.screenshot(name, type); }
  async captureOnFailure(name, err) { return this.utils.captureOnFailure(name, err); }
  async isDisplayed(locator) { return this.utils.isDisplayed(locator); }
  async waitForText(text, timeout) { return this.utils.waitForText(text, timeout); }
  async scrollTo(locator) { return this.utils.scrollTo(locator); }
  async scrollToBottom() { return this.utils.scrollToBottom(); }
  async scrollToTop() { return this.utils.scrollToTop(); }
  async getPageSource() { return this.utils.getPageSource(); }
}

module.exports = BasePage;
