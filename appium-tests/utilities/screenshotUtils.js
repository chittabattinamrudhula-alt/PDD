const path = require('path');
const fs = require('fs');
const moment = require('moment');
const logger = require('./logger');

const screenshotsDir = path.join(__dirname, '../reports/screenshots');
const failuresDir = path.join(__dirname, '../reports/failures');

[screenshotsDir, failuresDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

const ScreenshotUtils = {
  async capture(driver, testName, type = 'step') {
    const ts = moment().format('YYYYMMDD_HHmmss_SSS');
    const safe = testName.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 60);
    const filename = `${type}_${safe}_${ts}.png`;
    const dir = type === 'failure' ? failuresDir : screenshotsDir;
    const filepath = path.join(dir, filename);
    try {
      await driver.saveScreenshot(filepath);
      logger.info(`Screenshot saved: ${filepath}`);
      return filepath;
    } catch (err) {
      logger.error(`Screenshot failed: ${err.message}`);
      return null;
    }
  },

  async captureOnFailure(driver, testName, error) {
    const screenshotPath = await this.capture(driver, testName, 'failure');
    let deviceLogs = '';
    try {
      const logs = await driver.getLogs('logcat');
      deviceLogs = logs.map(l => `[${l.level}] ${l.message}`).join('\n');
      const ts = moment().format('YYYYMMDD_HHmmss');
      const logFile = path.join(failuresDir, `logs_${testName.replace(/[^a-zA-Z0-9]/g, '_')}_${ts}.txt`);
      fs.writeFileSync(logFile, `Test: ${testName}\nError: ${error?.message}\nStack: ${error?.stack}\n\nDevice Logs:\n${deviceLogs}`);
    } catch (logErr) {
      logger.warn(`Could not capture device logs: ${logErr.message}`);
    }
    return screenshotPath;
  }
};

module.exports = ScreenshotUtils;
