module.exports = {
  spec: 'tests/**/*.spec.js',
  timeout: 90000,
  retries: 1,
  reporter: 'mochawesome',
  reporterOptions: {
    reportDir: 'reports/mochawesome',
    reportFilename: 'selenium-report',
    overwrite: false,
    html: true,
    json: true,
    charts: true
  },
  require: ['dotenv/config']
};
