const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logsDir = path.join(__dirname, '../reports/logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const stepLogs = [];

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] [${level.toUpperCase()}] ${message}`)
  ),
  transports: [
    new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) }),
    new winston.transports.File({ filename: path.join(logsDir, 'selenium-tests.log') }),
    new winston.transports.File({ filename: path.join(logsDir, 'selenium-errors.log'), level: 'error' })
  ]
});

logger.logStep = (testName, step, result, remarks = '') => {
  stepLogs.push({ timestamp: new Date().toISOString(), testName, step, result, remarks });
  logger.info(`[STEP] ${testName} | ${step} | ${result}`);
};
logger.getStepLogs = () => stepLogs;
logger.clearStepLogs = () => { stepLogs.length = 0; };

module.exports = logger;
