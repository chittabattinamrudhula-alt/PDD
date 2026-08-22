const { By, until, Key } = require('selenium-webdriver');
const config = require('../config/selenium.config');
const logger = require('./logger');
const path = require('path');
const fs = require('fs');
const moment = require('moment');

const screenshotsDir = path.join(__dirname, '../reports/screenshots');
const failuresDir = path.join(__dirname, '../reports/failures');
[screenshotsDir, failuresDir].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

class SeleniumUtils {
  constructor(driver) {
    this.driver = driver;
    this.wait = config.timeouts.explicit;
  }

  // ── Finders ────────────────────────────────────────────────────────────────
  byId(id) { return By.id(id); }
  byCSS(css) { return By.css(css); }
  byXPath(xpath) { return By.xpath(xpath); }
  byText(text) { return By.xpath(`//*[normalize-space(text())="${text}"]`); }
  byContainsText(text) { return By.xpath(`//*[contains(text(),"${text}")]`); }
  byAttr(attr, val) { return By.css(`[${attr}="${val}"]`); }
  byTestId(id) { return By.css(`[data-testid="${id}"]`); }
  byAriaLabel(label) { return By.css(`[aria-label="${label}"]`); }
  byPlaceholder(ph) { return By.css(`[placeholder="${ph}"]`); }

  // ── Waits ──────────────────────────────────────────────────────────────────
  async waitForElement(locator, timeout = this.wait) {
    await this.driver.wait(until.elementLocated(locator), timeout);
    const el = await this.driver.findElement(locator);
    await this.driver.wait(until.elementIsVisible(el), timeout);
    return el;
  }

  async waitForText(text, timeout = this.wait) {
    return this.waitForElement(this.byContainsText(text), timeout);
  }

  async waitForURL(urlPart, timeout = this.wait) {
    await this.driver.wait(until.urlContains(urlPart), timeout);
  }

  async waitForElementToDisappear(locator, timeout = this.wait) {
    try {
      const el = await this.driver.findElement(locator);
      await this.driver.wait(until.elementIsNotVisible(el), timeout);
    } catch { /* element gone - that's fine */ }
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  async click(locator) {
    const el = await this.waitForElement(locator);
    await el.click();
    logger.info(`Clicked: ${locator}`);
    return el;
  }

  async type(locator, text) {
    const el = await this.waitForElement(locator);
    await el.clear();
    await el.sendKeys(text);
    logger.info(`Typed "${text}"`);
    return el;
  }

  async getText(locator) {
    const el = await this.waitForElement(locator);
    return el.getText();
  }

  async getValue(locator) {
    const el = await this.waitForElement(locator);
    return el.getAttribute('value');
  }

  async isDisplayed(locator) {
    try {
      const el = await this.driver.findElement(locator);
      return el.isDisplayed();
    } catch { return false; }
  }

  async isEnabled(locator) {
    try {
      const el = await this.driver.findElement(locator);
      return el.isEnabled();
    } catch { return false; }
  }

  async getAttribute(locator, attr) {
    const el = await this.waitForElement(locator);
    return el.getAttribute(attr);
  }

  async getCSSValue(locator, prop) {
    const el = await this.waitForElement(locator);
    return el.getCssValue(prop);
  }

  async scrollTo(locator) {
    const el = await this.waitForElement(locator);
    await this.driver.executeScript('arguments[0].scrollIntoView({behavior:"smooth",block:"center"})', el);
    return el;
  }

  async scrollToBottom() {
    await this.driver.executeScript('window.scrollTo(0, document.body.scrollHeight)');
  }

  async scrollToTop() {
    await this.driver.executeScript('window.scrollTo(0, 0)');
  }

  async jsClick(locator) {
    const el = await this.waitForElement(locator);
    await this.driver.executeScript('arguments[0].click()', el);
  }

  async getURL() { return this.driver.getCurrentUrl(); }
  async getTitle() { return this.driver.getTitle(); }
  async getPageSource() { return this.driver.getPageSource(); }

  async getBrowserLogs() {
    try {
      const logs = await this.driver.manage().logs().get('browser');
      return logs.map(l => `[${l.level.name}] ${l.message}`).join('\n');
    } catch { return ''; }
  }

  async pressKey(locator, key) {
    const el = await this.waitForElement(locator);
    await el.sendKeys(key);
  }

  async pressEnter(locator) { await this.pressKey(locator, Key.ENTER); }
  async pressTab(locator) { await this.pressKey(locator, Key.TAB); }

  async pause(ms = 1000) { await this.driver.sleep(ms); }

  // ── Screenshots ────────────────────────────────────────────────────────────
  async screenshot(name, type = 'step') {
    const ts = moment().format('YYYYMMDD_HHmmss_SSS');
    const safe = name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 60);
    const dir = type === 'failure' ? failuresDir : screenshotsDir;
    const filepath = path.join(dir, `${type}_${safe}_${ts}.png`);
    try {
      const data = await this.driver.takeScreenshot();
      fs.writeFileSync(filepath, data, 'base64');
      logger.info(`Screenshot: ${filepath}`);
      return filepath;
    } catch (e) { logger.error(`Screenshot failed: ${e.message}`); return null; }
  }

  async captureOnFailure(testName, error) {
    const ss = await this.screenshot(testName, 'failure');
    const logs = await this.getBrowserLogs();
    const dir = failuresDir;
    const logFile = path.join(dir, `${testName.replace(/[^a-zA-Z0-9]/g, '_')}_${moment().format('HHmmss')}.txt`);
    fs.writeFileSync(logFile, `Test: ${testName}\nError: ${error?.message}\nStack: ${error?.stack}\nURL: ${await this.getURL()}\n\nBrowser Console:\n${logs}`);
    return ss;
  }
}

module.exports = SeleniumUtils;
