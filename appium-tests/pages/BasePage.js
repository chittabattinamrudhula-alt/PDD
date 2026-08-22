const AppiumConfig = require('../config/appium.config');
const logger = require('../utilities/logger');
const ScreenshotUtils = require('../utilities/screenshotUtils');

class BasePage {
  constructor(driver) {
    this.driver = driver;
    this.explicitWait = AppiumConfig.timeouts.explicit;
  }

  // ── Element Finders ────────────────────────────────────────────────────────
  async findById(id) {
    return this.driver.$(`~${id}`); // accessibility id
  }

  async findByText(text) {
    return this.driver.$(`android=new UiSelector().text("${text}")`);
  }

  async findByContainsText(text) {
    return this.driver.$(`android=new UiSelector().textContains("${text}")`);
  }

  async findByXPath(xpath) {
    return this.driver.$(xpath);
  }

  async findByClass(className) {
    return this.driver.$(`android=new UiSelector().className("${className}")`);
  }

  async findByResourceId(resourceId) {
    return this.driver.$(`id:${resourceId}`);
  }

  // ── Wait helpers ───────────────────────────────────────────────────────────
  async waitForElement(selector, timeout = this.explicitWait) {
    const el = this.driver.$(selector);
    await el.waitForDisplayed({ timeout });
    return el;
  }

  async waitForText(text, timeout = this.explicitWait) {
    return this.waitForElement(`android=new UiSelector().text("${text}")`, timeout);
  }

  async waitForElementToDisappear(selector, timeout = this.explicitWait) {
    const el = this.driver.$(selector);
    await el.waitForDisplayed({ timeout, reverse: true });
  }

  async isDisplayed(selector) {
    try {
      const el = this.driver.$(selector);
      return await el.isDisplayed();
    } catch {
      return false;
    }
  }

  async isEnabled(selector) {
    try {
      const el = this.driver.$(selector);
      return await el.isEnabled();
    } catch {
      return false;
    }
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  async click(selector) {
    const el = await this.waitForElement(selector);
    await el.click();
    logger.info(`Clicked: ${selector}`);
  }

  async typeText(selector, text) {
    const el = await this.waitForElement(selector);
    await el.clearValue();
    await el.setValue(text);
    logger.info(`Typed "${text}" into: ${selector}`);
  }

  async clearField(selector) {
    const el = await this.waitForElement(selector);
    await el.clearValue();
  }

  async getText(selector) {
    const el = await this.waitForElement(selector);
    return el.getText();
  }

  async getAttribute(selector, attr) {
    const el = await this.waitForElement(selector);
    return el.getAttribute(attr);
  }

  async pressBack() {
    await this.driver.back();
    logger.info('Pressed BACK button');
  }

  async pressHome() {
    await this.driver.home();
    logger.info('Pressed HOME button');
  }

  async hideKeyboard() {
    try {
      await this.driver.hideKeyboard();
    } catch { /* ignore */ }
  }

  async pause(ms = 1000) {
    await this.driver.pause(ms);
  }

  async screenshot(testName, type = 'step') {
    return ScreenshotUtils.capture(this.driver, testName, type);
  }

  async getCurrentActivity() {
    return this.driver.getCurrentActivity();
  }

  async getPageSource() {
    return this.driver.getPageSource();
  }
}

module.exports = BasePage;
