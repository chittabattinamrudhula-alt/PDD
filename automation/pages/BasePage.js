'use strict';
const WebUtils = require('../utils/webUtils');
const config   = require('../config/config');

class BasePage {
  constructor(driver) {
    this.driver  = driver;
    this.w       = new WebUtils(driver);
    this.baseUrl = config.baseUrl;
  }

  async open(path = '') {
    // Strip trailing slash from base, add leading slash to path if needed
    const base = this.baseUrl.replace(/\/$/, '');
    const p    = path ? (path.startsWith('/') ? path : '/' + path) : '';
    await this.w.navigate(`${base}${p}`);
  }

  async getTitle()       { return this.w.getTitle(); }
  async getURL()         { return this.w.getURL(); }
  async getPageSource()  { return this.w.getPageSource(); }
  async pause(ms)        { return this.w.pause(ms); }
  async screenshot(n, t) { return this.w.screenshot(n, t); }
  async captureOnFailure(n, e) { return this.w.captureOnFailure(n, e); }
  async isDisplayed(loc) { return this.w.isDisplayed(loc); }
  async scrollToBottom() { return this.w.scrollToBottom(); }
  async scrollToTop()    { return this.w.scrollToTop(); }
  async refresh()        { return this.w.refresh(); }
  async goBack()         { return this.w.goBack(); }
}

module.exports = BasePage;
