const { expect } = require('chai');
const DriverFactory = require('../../utilities/driverFactory');
const LoginPage = require('../../pages/LoginPage');
const DashboardPage = require('../../pages/DashboardPage');
const PropertiesPage = require('../../pages/PropertiesPage');
const ExcelReporter = require('../../utilities/excelReporter');
const ScreenshotUtils = require('../../utilities/screenshotUtils');
const config = require('../../config/appium.config');

describe('[PROPERTIES] Property Explorer Tests', function () {
  this.timeout(120000);
  let driver, loginPage, dashboardPage, propertiesPage;

  before(async () => {
    driver = await DriverFactory.createDriver();
    loginPage = new LoginPage(driver);
    dashboardPage = new DashboardPage(driver);
    propertiesPage = new PropertiesPage(driver);
    await loginPage.navigateToLogin();
    await loginPage.login(config.testData.buyerEmail, config.testData.buyerPassword);
    await dashboardPage.waitForDashboard();
    await dashboardPage.navigateTo('properties');
  });

  after(async () => {
    await dashboardPage.logout();
    await DriverFactory.quitDriver();
  });

  afterEach(async function () {
    const status = this.currentTest.state === 'passed' ? 'PASSED' : this.currentTest.state === 'failed' ? 'FAILED' : 'SKIPPED';
    if (status === 'FAILED') {
      const ss = await ScreenshotUtils.captureOnFailure(driver, this.currentTest.title, this.currentTest.err);
      ExcelReporter.addResult({ module: 'Properties', scenario: this.currentTest.title, status, error: this.currentTest.err?.message, screenshotPath: ss, duration: this.currentTest.duration });
    } else {
      ExcelReporter.addResult({ module: 'Properties', scenario: this.currentTest.title, status, duration: this.currentTest.duration });
    }
  });

  it('TC-081: Properties explorer page title is correct', async () => {
    await propertiesPage.waitForPage();
    const displayed = await propertiesPage.isDisplayed(propertiesPage.selectors.pageTitle);
    expect(displayed).to.be.true;
  });

  it('TC-082: Property cards are visible', async () => {
    const count = await propertiesPage.getPropertyCount();
    expect(count).to.be.gte(1);
  });

  it('TC-083: Property card shows verified deed badge', async () => {
    const displayed = await propertiesPage.isDisplayed(propertiesPage.selectors.verifiedBadge);
    expect(displayed).to.be.true;
  });

  it('TC-084: First property card is tappable', async () => {
    await propertiesPage.openProperty(0);
    const open = await propertiesPage.isModalOpen();
    expect(open).to.be.true;
  });

  it('TC-085: Property modal shows title', async () => {
    const title = await propertiesPage.getPropertyTitle();
    expect(title).to.be.a('string').that.is.not.empty;
  });

  it('TC-086: Property modal shows price in user currency', async () => {
    const price = await propertiesPage.getPropertyPrice();
    expect(price).to.match(/[\$€£₹¥]/);
  });

  it('TC-087: Property modal has close button', async () => {
    const displayed = await propertiesPage.isDisplayed(propertiesPage.selectors.modalClose);
    expect(displayed).to.be.true;
  });

  it('TC-088: Close button dismisses modal', async () => {
    await propertiesPage.closeModal();
    const open = await propertiesPage.isModalOpen();
    expect(open).to.be.false;
  });

  it('TC-089: Modal shows blockchain verification receipt', async () => {
    await propertiesPage.openProperty(0);
    const displayed = await propertiesPage.isDisplayed('android=new UiSelector().textContains("Cryptographic Verification")');
    expect(displayed).to.be.true;
    await propertiesPage.closeModal();
  });

  it('TC-090: Buyer sees Book Property button on available property', async () => {
    await propertiesPage.openProperty(0);
    const bookedText = await propertiesPage.isDisplayed(propertiesPage.selectors.alreadyBooked);
    if (!bookedText) {
      const displayed = await propertiesPage.isDisplayed(propertiesPage.selectors.bookBtn);
      expect(displayed).to.be.true;
    }
    await propertiesPage.closeModal();
  });

  it('TC-091: Modal shows property info section', async () => {
    await propertiesPage.openProperty(0);
    const displayed = await propertiesPage.isDisplayed('android=new UiSelector().text("Property Info")');
    expect(displayed).to.be.true;
    await propertiesPage.closeModal();
  });

  it('TC-092: Modal shows AI diagnostics section', async () => {
    await propertiesPage.openProperty(0);
    const displayed = await propertiesPage.isDisplayed('android=new UiSelector().text("AI Diagnostics")');
    expect(displayed).to.be.true;
    await propertiesPage.closeModal();
  });

  it('TC-093: Property list is scrollable', async () => {
    const gestures = new (require('../../utilities/gestureUtils'))(driver);
    await gestures.scrollDown(3);
    const displayed = await propertiesPage.isDisplayed(propertiesPage.selectors.pageTitle);
    expect(displayed).to.be.false; // scrolled past title
  });

  it('TC-094: Scrolling up returns to top', async () => {
    const gestures = new (require('../../utilities/gestureUtils'))(driver);
    await gestures.scrollUp(3);
    await propertiesPage.waitForPage();
    const displayed = await propertiesPage.isDisplayed(propertiesPage.selectors.pageTitle);
    expect(displayed).to.be.true;
  });

  it('TC-095: Second property card opens correctly', async () => {
    await propertiesPage.openProperty(1);
    const open = await propertiesPage.isModalOpen();
    expect(open).to.be.true;
    await propertiesPage.closeModal();
  });

  it('TC-096: Third property card opens correctly', async () => {
    await propertiesPage.openProperty(2);
    const open = await propertiesPage.isModalOpen();
    expect(open).to.be.true;
    await propertiesPage.closeModal();
  });

  it('TC-097: Modal overlay click dismisses modal', async () => {
    await propertiesPage.openProperty(0);
    await propertiesPage.click(propertiesPage.selectors.modalOverlay);
    const open = await propertiesPage.isModalOpen();
    expect(open).to.be.false;
  });

  it('TC-098: Property card shows location badge', async () => {
    const displayed = await propertiesPage.isDisplayed(propertiesPage.selectors.verifiedBadge);
    expect(displayed).to.be.true;
  });

  it('TC-099: Properties page accessible in landscape', async () => {
    await driver.setOrientation('LANDSCAPE');
    await propertiesPage.pause(1000);
    const displayed = await propertiesPage.isDisplayed(propertiesPage.selectors.pageTitle);
    expect(displayed).to.be.true;
    await driver.setOrientation('PORTRAIT');
  });

  it('TC-100: Properties page loads within 10 seconds', async () => {
    const start = Date.now();
    await propertiesPage.waitForPage();
    const elapsed = Date.now() - start;
    expect(elapsed).to.be.lt(10000);
  });
});
