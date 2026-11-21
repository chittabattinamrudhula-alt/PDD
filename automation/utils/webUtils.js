'use strict';
const { By, until, Key } = require('selenium-webdriver');
const config  = require('../config/config');
const logger  = require('./logger');
const path    = require('path');
const fs      = require('fs');
const moment  = require('moment');

const SS_DIR   = path.join(__dirname, '../reports/screenshots');
const FAIL_DIR = path.join(__dirname, '../reports/failures');
[SS_DIR, FAIL_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

class WebUtils {
  constructor(driver) {
    this.driver  = driver;
    this.timeout = config.timeouts.explicit;
  }

  // ── Locator helpers ───────────────────────────────────────────────────────
  byId(id)             { return By.id(id); }
  byCss(css)           { return By.css(css); }
  byXPath(xp)          { return By.xpath(xp); }
  byText(t)            { return By.xpath(`//*[normalize-space(text())="${t}"]`); }
  byContains(t)        { return By.xpath(`//*[contains(text(),"${t}")]`); }
  byPlaceholder(ph)    { return By.css(`[placeholder="${ph}"]`); }
  byAriaLabel(l)       { return By.css(`[aria-label="${l}"]`); }
  byRole(r, name)      { return name ? By.xpath(`//*[@role="${r}" and contains(@aria-label,"${name}")]`) : By.css(`[role="${r}"]`); }
  byDataTestId(id)     { return By.css(`[data-testid="${id}"]`); }

  // ── Waits ─────────────────────────────────────────────────────────────────
  async waitForElement(locator, timeout = this.timeout) {
    await this.driver.wait(until.elementLocated(locator), timeout,
      `Element not located: ${locator}`);
    const el = await this.driver.findElement(locator);
    await this.driver.wait(until.elementIsVisible(el), timeout,
      `Element not visible: ${locator}`);
    return el;
  }

  async waitForText(text, timeout = this.timeout) {
    return this.waitForElement(this.byContains(text), timeout);
  }

  async waitForURL(part, timeout = this.timeout) {
    await this.driver.wait(until.urlContains(part), timeout);
  }

  async waitForGone(locator, timeout = this.timeout) {
    try {
      const el = await this.driver.findElement(locator);
      await this.driver.wait(until.elementIsNotVisible(el), timeout);
    } catch { /* already gone */ }
  }

  async waitForPageLoad(timeout = config.timeouts.pageLoad) {
    await this.driver.wait(async () => {
      const state = await this.driver.executeScript('return document.readyState');
      return state === 'complete';
    }, timeout, 'Page did not finish loading');
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  async click(locator) {
    const el = await this.waitForElement(locator);
    await el.click();
    return el;
  }

  async jsClick(locator) {
    const el = await this.waitForElement(locator);
    await this.driver.executeScript('arguments[0].click()', el);
    return el;
  }

  async type(locator, text) {
    const el = await this.waitForElement(locator);
    await el.clear();
    await el.sendKeys(text);
    return el;
  }

  async clearAndType(locator, text) {
    const el = await this.waitForElement(locator);
    await this.driver.executeScript('arguments[0].value=""', el);
    await el.sendKeys(text);
    return el;
  }

  async selectByValue(locator, value) {
    const el = await this.waitForElement(locator);
    await this.driver.executeScript(`
      arguments[0].value = '${value}';
      arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
    `, el);
  }

  async pressKey(locator, key) {
    const el = await this.waitForElement(locator);
    await el.sendKeys(key);
  }

  async pressEnter(locator)   { await this.pressKey(locator, Key.ENTER); }
  async pressTab(locator)     { await this.pressKey(locator, Key.TAB); }
  async pressEscape(locator)  { await this.pressKey(locator, Key.ESCAPE); }

  async hover(locator) {
    const el = await this.waitForElement(locator);
    const actions = this.driver.actions({ async: true });
    await actions.move({ origin: el }).perform();
    return el;
  }

  // ── Queries ───────────────────────────────────────────────────────────────
  async getText(locator) {
    const el = await this.waitForElement(locator);
    return el.getText();
  }

  async getValue(locator) {
    const el = await this.waitForElement(locator);
    return el.getAttribute('value');
  }

  async getAttribute(locator, attr) {
    const el = await this.waitForElement(locator);
    return el.getAttribute(attr);
  }

  async getCssValue(locator, prop) {
    const el = await this.waitForElement(locator);
    return el.getCssValue(prop);
  }

  async isDisplayed(locator) {
    try {
      const el = await this.driver.findElement(locator);
      return await el.isDisplayed();
    } catch { return false; }
  }

  async isEnabled(locator) {
    try {
      const el = await this.driver.findElement(locator);
      return await el.isEnabled();
    } catch { return false; }
  }

  async countElements(locator) {
    const els = await this.driver.findElements(locator);
    return els.length;
  }

  async getPageSource()   { return this.driver.getPageSource(); }
  async getTitle()        { return this.driver.getTitle(); }
  async getURL()          { return this.driver.getCurrentUrl(); }

  async getBrowserLogs() {
    try {
      const logs = await this.driver.manage().logs().get('browser');
      return logs.map(l => `[${l.level.name}] ${l.message}`);
    } catch { return []; }
  }

  async getConsoleErrors() {
    const logs = await this.getBrowserLogs();
    return logs.filter(l => l.startsWith('[SEVERE]'));
  }

  async getPageLoadTime() {
    const timing = await this.driver.executeScript(`
      const t = window.performance.timing;
      return t.loadEventEnd - t.navigationStart;
    `);
    return parseInt(timing) || 0;
  }

  // ── Scroll ────────────────────────────────────────────────────────────────
  async scrollTo(locator) {
    const el = await this.waitForElement(locator);
    await this.driver.executeScript(
      'arguments[0].scrollIntoView({ behavior:"smooth", block:"center" })', el
    );
    return el;
  }
  async scrollToTop()    { await this.driver.executeScript('window.scrollTo(0,0)'); }
  async scrollToBottom() { await this.driver.executeScript('window.scrollTo(0,document.body.scrollHeight)'); }

  // ── Viewport ──────────────────────────────────────────────────────────────
  async setViewport(width, height) {
    await this.driver.manage().window().setRect({ width, height });
    await this.pause(300);
  }

  async resetViewport() { await this.setViewport(1920, 1080); }

  // ── Screenshot ────────────────────────────────────────────────────────────
  async screenshot(name, type = 'step') {
    const ts   = moment().format('YYYYMMDD_HHmmss_SSS');
    const safe = name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 60);
    const dir  = type === 'failure' ? FAIL_DIR : SS_DIR;
    const fp   = path.join(dir, `${type}_${safe}_${ts}.png`);
    try {
      const data = await this.driver.takeScreenshot();
      fs.writeFileSync(fp, data, 'base64');
      logger.info(`Screenshot: ${fp}`);
      return fp;
    } catch (e) {
      logger.error(`Screenshot failed: ${e.message}`);
      return null;
    }
  }

  async captureOnFailure(testName, error) {
    const ss  = await this.screenshot(testName, 'failure');
    const url = await this.getURL().catch(() => 'unknown');
    const logs = (await this.getBrowserLogs()).join('\n');
    const safe = testName.replace(/[^a-zA-Z0-9_]/g, '_');
    const logPath = path.join(FAIL_DIR, `${safe}_${moment().format('HHmmss')}.txt`);
    fs.writeFileSync(logPath,
      `Test  : ${testName}\nURL   : ${url}\nError : ${error?.message}\nStack : ${error?.stack}\n\nConsole:\n${logs}`
    );
    return ss;
  }

  // ── Misc ──────────────────────────────────────────────────────────────────
  async pause(ms = 500) { await this.driver.sleep(ms); }

  async navigate(url) {
    await this.driver.get(url);
    await this.waitForPageLoad();
  }

  async refresh() {
    await this.driver.navigate().refresh();
    await this.waitForPageLoad();
  }

  async goBack() {
    await this.driver.navigate().back();
    await this.waitForPageLoad();
  }

  async executeScript(script, ...args) {
    return this.driver.executeScript(script, ...args);
  }
}

module.exports = WebUtils;
