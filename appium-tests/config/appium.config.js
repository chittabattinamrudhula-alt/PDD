require('dotenv').config();

const AppiumConfig = {
  server: {
    host: process.env.APPIUM_HOST || 'localhost',
    port: parseInt(process.env.APPIUM_PORT) || 4723,
    path: '/',
    logLevel: 'info'
  },

  capabilities: {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': process.env.ANDROID_DEVICE_NAME || 'emulator-5554',
    'appium:platformVersion': process.env.ANDROID_PLATFORM_VERSION || '13.0',
    'appium:app': process.env.APK_PATH || './app/app-release.apk',
    'appium:appPackage': process.env.APP_PACKAGE || 'com.example.mobile',
    'appium:appActivity': process.env.APP_ACTIVITY || 'com.example.mobile.MainActivity',
    'appium:autoGrantPermissions': true,
    'appium:fullReset': false,
    'appium:noReset': false,
    'appium:newCommandTimeout': 300,
    'appium:androidInstallTimeout': 120000,
    'appium:adbExecTimeout': 60000,
    'appium:uiautomator2ServerLaunchTimeout': 60000,
    'appium:uiautomator2ServerInstallTimeout': 60000,
    'appium:skipDeviceInitialization': false,
    'appium:skipServerInstallation': false,
    'appium:ignoreHiddenApiPolicyError': true,
    'appium:disableWindowAnimation': true,
    'appium:waitForIdleTimeout': 100
  },

  timeouts: {
    implicit: parseInt(process.env.IMPLICIT_WAIT) || 10000,
    explicit: parseInt(process.env.EXPLICIT_WAIT) || 30000,
    pageLoad: 60000,
    script: 30000
  },

  testData: {
    buyerEmail: process.env.TEST_BUYER_EMAIL || 'buyer@propai.com',
    buyerPassword: process.env.TEST_BUYER_PASSWORD || 'password',
    sellerEmail: process.env.TEST_SELLER_EMAIL || 'seller@propai.com',
    sellerPassword: process.env.TEST_SELLER_PASSWORD || 'password',
    adminEmail: process.env.TEST_ADMIN_EMAIL || 'admin@propai.com',
    adminPassword: process.env.TEST_ADMIN_PASSWORD || 'password'
  },

  reporting: {
    screenshotsDir: './reports/screenshots',
    failuresDir: './reports/failures',
    logsDir: './reports/logs',
    excelDir: './reports/excel',
    htmlDir: './reports/mochawesome'
  }
};

module.exports = AppiumConfig;
