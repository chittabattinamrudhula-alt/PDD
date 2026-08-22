const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logsDir = path.join(__dirname, '../reports/logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      return stack
        ? `[${timestamp}] [${level.toUpperCase()}] ${message}\n${stack}`
        : `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message }) =>
          `[${timestamp}] [${level}] ${message}`
        )
      )
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'appium-tests.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'appium-errors.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024
    })
  ]
});

// Step logger for Excel tracking
const stepLogs = [];

logger.logStep = (testName, step, result, remarks = '') => {
  const entry = {
    timestamp: new Date().toISOString(),
    testName,
    step,
    result,
    remarks
  };
  stepLogs.push(entry);
  logger.info(`[STEP] ${testName} | ${step} | ${result} | ${remarks}`);
};

logger.getStepLogs = () => stepLogs;
logger.clearStepLogs = () => { stepLogs.length = 0; };

module.exports = logger;
