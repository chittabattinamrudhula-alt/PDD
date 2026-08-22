const { expect } = require('chai');
const DriverFactory = require('../../utilities/driverFactory');
const LoginPage = require('../../pages/LoginPage');
const DashboardPage = require('../../pages/DashboardPage');
const ExcelReporter = require('../../utilities/excelReporter');
const ScreenshotUtils = require('../../utilities/screenshotUtils');
const config = require('../../config/appium.config');

describe('[LEDGER] Blockchain Ledger Tests', function () {
  this.timeout(120000);
  let driver, loginPage, dashboardPage;

  before(async () => {
    driver = await DriverFactory.createDriver();
    loginPage = new LoginPage(driver);
    dashboardPage = new DashboardPage(driver);
    await loginPage.navigateToLogin();
    await loginPage.login(config.testData.adminEmail, config.testData.adminPassword);
    await dashboardPage.waitForDashboard();
    await dashboardPage.navigateTo('ledger');
  });

  after(async () => { await dashboardPage.logout(); await DriverFactory.quitDriver(); });

  afterEach(async function () {
    const st = this.currentTest.state === 'passed' ? 'PASSED' : this.currentTest.state === 'failed' ? 'FAILED' : 'SKIPPED';
    if (st === 'FAILED') {
      const ss = await ScreenshotUtils.captureOnFailure(driver, this.currentTest.title, this.currentTest.err);
      ExcelReporter.addResult({ module: 'Ledger', scenario: this.currentTest.title, status: st, error: this.currentTest.err?.message, screenshotPath: ss });
    } else {
      ExcelReporter.addResult({ module: 'Ledger', scenario: this.currentTest.title, status: st });
    }
  });

  it('TC-201: Ledger page title is visible', async () => {
    const d = await dashboardPage.isDisplayed('android=new UiSelector().text("Title Registry Blockchain Ledger")');
    expect(d).to.be.true;
  });

  it('TC-202: Genesis block is present', async () => {
    const d = await dashboardPage.isDisplayed('android=new UiSelector().textContains("Block #0")');
    expect(d).to.be.true;
  });

  it('TC-203: Genesis block is labelled correctly', async () => {
    const d = await dashboardPage.isDisplayed('android=new UiSelector().textContains("Genesis")');
    expect(d).to.be.true;
  });

  it('TC-204: At least one additional block exists', async () => {
    const d = await dashboardPage.isDisplayed('android=new UiSelector().textContains("Block #1")');
    expect(d).to.be.true;
  });

  it('TC-205: Block timestamp is shown', async () => {
    const d = await dashboardPage.isDisplayed('~block-timestamp-0');
    expect(d).to.be.true;
  });

  it('TC-206: Block hash text is visible', async () => {
    const d = await dashboardPage.isDisplayed('~hash-text-0');
    expect(d).to.be.true;
  });

  it('TC-207: Ledger diagnostics panel is visible', async () => {
    const d = await dashboardPage.isDisplayed('android=new UiSelector().text("Ledger Diagnostics")');
    expect(d).to.be.true;
  });

  it('TC-208: Proof of Work consensus label shown', async () => {
    const d = await dashboardPage.isDisplayed('android=new UiSelector().text("Proof of Work")');
    expect(d).to.be.true;
  });

  it('TC-209: Ledger blocks count is shown', async () => {
    const d = await dashboardPage.isDisplayed('android=new UiSelector().textContains("Mined")');
    expect(d).to.be.true;
  });

  it('TC-210: Chain Cryptographically Intact badge shown', async () => {
    const d = await dashboardPage.isDisplayed('android=new UiSelector().text("Chain Cryptographically Intact")');
    expect(d).to.be.true;
  });

  it('TC-211: Tapping a block opens detail modal', async () => {
    await dashboardPage.click('android=new UiSelector().textContains("Block #0")');
    const d = await dashboardPage.isDisplayed('~modal-overlay');
    expect(d).to.be.true;
  });

  it('TC-212: Block modal shows Audit Vetting Dashboard title', async () => {
    const d = await dashboardPage.isDisplayed('android=new UiSelector().text("Audit Vetting Dashboard")');
    expect(d).to.be.true;
  });

  it('TC-213: Block modal shows hash value', async () => {
    const d = await dashboardPage.isDisplayed('~modal-hash');
    expect(d).to.be.true;
  });

  it('TC-214: Block modal shows Raw Block Metadata section', async () => {
    const d = await dashboardPage.isDisplayed('android=new UiSelector().text("Raw Block Metadata")');
    expect(d).to.be.true;
  });

  it('TC-215: Block modal close button works', async () => {
    await dashboardPage.click('android=new UiSelector().text("✕ Close")');
    const d = await dashboardPage.isDisplayed('~modal-overlay');
    expect(d).to.be.false;
  });

  it('TC-216: Block #1 can be opened', async () => {
    const g = new (require('../../utilities/gestureUtils'))(driver);
    await g.scrollDown(1);
    await dashboardPage.click('android=new UiSelector().textContains("Block #1")');
    const d = await dashboardPage.isDisplayed('~modal-overlay');
    expect(d).to.be.true;
    await dashboardPage.click('android=new UiSelector().text("✕ Close")');
  });

  it('TC-217: Ledger page scrolls to show all blocks', async () => {
    const g = new (require('../../utilities/gestureUtils'))(driver);
    await g.scrollDown(3);
    const d = await dashboardPage.isDisplayed('android=new UiSelector().textContains("Block #")');
    expect(d).to.be.true;
  });

  it('TC-218: Registration type is shown on block cards', async () => {
    const g = new (require('../../utilities/gestureUtils'))(driver);
    await g.scrollUp(3);
    const d = await dashboardPage.isDisplayed('android=new UiSelector().textContains("Registration Type:")');
    expect(d).to.be.true;
  });

  it('TC-219: Ledger loads under 5 seconds', async () => {
    const start = Date.now();
    await dashboardPage.navigateTo('dashboard');
    await dashboardPage.navigateTo('ledger');
    const elapsed = Date.now() - start;
    expect(elapsed).to.be.lt(5000);
  });

  it('TC-220: Ledger accessible in landscape orientation', async () => {
    await driver.setOrientation('LANDSCAPE');
    await dashboardPage.pause(800);
    const d = await dashboardPage.isDisplayed('android=new UiSelector().text("Title Registry Blockchain Ledger")');
    expect(d).to.be.true;
    await driver.setOrientation('PORTRAIT');
  });
});
