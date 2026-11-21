module.exports = {
  spec:    'tests/**/*.spec.js',
  timeout: 120000,
  retries: 2,
  reporter: 'mochawesome',
  reporterOptions: {
    reportDir:      'reports/mochawesome',
    reportFilename: 'report',
    overwrite:      false,
    html:           true,
    json:           true,
    charts:         true,
    code:           true,
    timestamp:      'ddmmyyyy_HHMMss',
    reportTitle:    'PropAI Live E2E Test Report',
    reportPageTitle:'PropAI Automation Results'
  },
  require: ['dotenv/config']
};
