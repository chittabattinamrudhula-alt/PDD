const { remote } = require('webdriverio');
const AppiumConfig = require('../config/appium.config');
const logger = require('./logger');

let driver = null;

const DriverFactory = {
  async createDriver() {
    try {
      logger.info('Initializing Appium WebdriverIO driver...');
      driver = await remote({
        protocol: 'http',
        hostname: AppiumConfig.server.host,
        port: AppiumConfig.server.port,
        path: AppiumConfig.server.path,
        capabilities: AppiumConfig.capabilities,
        logLevel: 'error',
        connectionRetryTimeout: 120000,
        connectionRetryCount: 3
      });
      await driver.setImplicitTimeout(AppiumConfig.timeouts.implicit);
      logger.info(`Driver created. Session ID: ${driver.sessionId}`);
      return driver;
    } catch (err) {
      logger.error(`Driver creation failed: ${err.message}`);
      throw err;
    }
  },

  async quitDriver() {
    if (driver) {
      try {
        await driver.deleteSession();
        logger.info('Driver session terminated.');
      } catch (err) {
        logger.warn(`Driver quit error: ${err.message}`);
      } finally {
        driver = null;
      }
    }
  },

  getDriver() {
    return driver;
  },

  async restartApp() {
    if (driver) {
      await driver.terminateApp(require('../config/appium.config').capabilities['appium:appPackage']);
      await driver.activateApp(require('../config/appium.config').capabilities['appium:appPackage']);
      logger.info('App restarted.');
    }
  },

  async resetApp() {
    if (driver) {
      await driver.reset();
      logger.info('App reset.');
    }
  }
};

module.exports = DriverFactory;
