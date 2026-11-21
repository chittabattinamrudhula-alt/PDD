'use strict';
const winston = require('winston');
const path    = require('path');
const fs      = require('fs');
const moment  = require('moment');

const logsDir = path.join(__dirname, '../reports/logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const stepLogs = [];
const testResults = [];

const fmt = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.printf(({ timestamp, level, message }) =>
    `[${timestamp}] [${level.toUpperCase().padEnd(5)}] ${message}`)
);

const logger = winston.createLogger({
  level: 'debug',
  format: fmt,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple())
    }),
    new winston.transports.File({
      filename: path.join(logsDir, `automation-${moment().format('YYYYMMDD_HHmmss')}.log`)
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'errors.log'),
      level: 'error'
    })
  ]
});

// Extended step logging
logger.step = (testId, step, status, detail = '') => {
  const entry = {
    timestamp: new Date().toISOString(),
    testId, step, status, detail
  };
  stepLogs.push(entry);
  logger.info(`[STEP] ${testId} | ${step} | ${status}${detail ? ' | ' + detail : ''}`);
};

logger.testResult = (testId, name, module, status, duration, error = null) => {
  testResults.push({ testId, name, module, status, duration, error, timestamp: new Date().toISOString() });
};

logger.getStepLogs    = () => [...stepLogs];
logger.getTestResults = () => [...testResults];
logger.clearAll       = () => { stepLogs.length = 0; testResults.length = 0; };

module.exports = logger;
