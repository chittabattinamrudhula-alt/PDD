'use strict';
const { Builder }  = require('selenium-webdriver');
const chrome       = require('selenium-webdriver/chrome');
const firefox      = require('selenium-webdriver/firefox');
const config       = require('../config/config');
const logger       = require('./logger');

let driver = null;

const DriverFactory = {
  async createDriver(browser = config.browser) {
    logger.info(`Creating ${browser} driver — headless: ${config.headless} — target: ${config.baseUrl}`);
    try {
      if (browser.toLowerCase() === 'firefox') {
        const opts = new firefox.Options();
        if (config.headless) opts.addArguments('-headless');
        opts.addArguments('--width=1920', '--height=1080');
        driver = await new Builder().forBrowser('firefox').setFirefoxOptions(opts).build();
      } else {
        // Chrome (default)
        const opts = new chrome.Options();
        if (config.headless) {
          opts.addArguments('--headless=new', '--disable-gpu');
        }
        opts.addArguments(
          '--window-size=1920,1080',
          '--no-sandbox',
          '--disable-dev-shm-usage',
          '--disable-extensions',
          '--disable-web-security',
          '--allow-running-insecure-content',
          '--ignore-certificate-errors',
          '--disable-features=IsolateOrigins',
          '--disable-site-isolation-trials',
          '--remote-debugging-port=9222'
        );
        driver = await new Builder().forBrowser('chrome').setChromeOptions(opts).build();
      }

      await driver.manage().setTimeouts({
        implicit: config.timeouts.implicit,
        pageLoad: config.timeouts.pageLoad,
        script:   config.timeouts.script
      });
      await driver.manage().window().maximize();
      logger.info(`✅ Driver ready — ${browser}`);
      return driver;
    } catch (err) {
      logger.error(`❌ Driver creation failed: ${err.message}`);
      throw err;
    }
  },

  async quitDriver() {
    if (driver) {
      try   { await driver.quit(); logger.info('Driver quit cleanly.'); }
      catch (e) { logger.warn(`Driver quit error: ${e.message}`); }
      finally   { driver = null; }
    }
  },

  getDriver() { return driver; }
};

module.exports = DriverFactory;
