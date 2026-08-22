module.exports = {
  spec: 'tests/**/*.spec.js',
  timeout: 120000,
  retries: 2,
  reporter: 'mochawesome',
  reporterOptions: {
    reportDir: 'reports/mochawesome',
    reportFilename: 'appium-report',
    overwrite: false,
    html: true,
    json: true,
    charts: true,
    saveAllAttempts: false
  },
  require: ['dotenv/config']
};
