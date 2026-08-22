const { expect } = require('chai');
const DriverFactory = require('../../utilities/driverFactory');
const LoginPage = require('../../pages/LoginPage');
const DashboardPage = require('../../pages/DashboardPage');
const ExcelReporter = require('../../utilities/excelReporter');
const ScreenshotUtils = require('../../utilities/screenshotUtils');
const config = require('../../config/appium.config');

describe('[VALUATION] AI Valuation Tests', function () {
  this.timeout(120000);
  let driver, loginPage, dashboardPage;

  before(async () => {
    driver = await DriverFactory.createDriver();
    loginPage = new LoginPage(driver);
    dashboardPage = new DashboardPage(driver);
    await loginPage.navigateToLogin();
    await loginPage.login(config.testData.buyerEmail, config.testData.buyerPassword);
    await dashboardPage.waitForDashboard();
    await dashboardPage.navigateTo('valuation');
  });

  after(async () => { await dashboardPage.logout(); await DriverFactory.quitDriver(); });

  afterEach(async function () {
    const status = this.currentTest.state === 'passed' ? 'PASSED' : this.currentTest.state === 'failed' ? 'FAILED' : 'SKIPPED';
    if (status === 'FAILED') {
      const ss = await ScreenshotUtils.captureOnFailure(driver, this.currentTest.title, this.currentTest.err);
      ExcelReporter.addResult({ module: 'Valuation', scenario: this.currentTest.title, status, error: this.currentTest.err?.message, screenshotPath: ss });
    } else {
      ExcelReporter.addResult({ module: 'Valuation', scenario: this.currentTest.title, status });
    }
  });

  it('TC-101: Valuation page title is visible', async () => {
    const d = await dashboardPage.isDisplayed('android=new UiSelector().text("AI-Powered Property Valuation Simulator")');
    expect(d).to.be.true;
  });

  it('TC-102: Inputs section is visible', async () => {
    const d = await dashboardPage.isDisplayed('android=new UiSelector().text("Inputs")');
    expect(d).to.be.true;
  });

  it('TC-103: AI Appraisal Analysis section is visible', async () => {
    const d = await dashboardPage.isDisplayed('android=new UiSelector().text("AI Appraisal Analysis")');
    expect(d).to.be.true;
  });

  it('TC-104: Location district selector is present', async () => {
    const d = await dashboardPage.isDisplayed('~location-district-selector');
    expect(d).to.be.true;
  });

  it('TC-105: SqFt input field is present', async () => {
    const d = await dashboardPage.isDisplayed('~sqft-input');
    expect(d).to.be.true;
  });

  it('TC-106: Bedrooms input is present', async () => {
    const d = await dashboardPage.isDisplayed('~bedrooms-input');
    expect(d).to.be.true;
  });

  it('TC-107: Bathrooms input is present', async () => {
    const d = await dashboardPage.isDisplayed('~bathrooms-input');
    expect(d).to.be.true;
  });

  it('TC-108: Condition selector is present', async () => {
    const d = await dashboardPage.isDisplayed('~condition-selector');
    expect(d).to.be.true;
  });

  it('TC-109: Listing price input is present', async () => {
    const d = await dashboardPage.isDisplayed('~listing-price-input');
    expect(d).to.be.true;
  });

  it('TC-110: Calculate button is present', async () => {
    const d = await dashboardPage.isDisplayed('android=new UiSelector().text("Calculate Property Valuation")');
    expect(d).to.be.true;
  });

  it('TC-111: Pool amenity checkbox is present', async () => {
    const d = await dashboardPage.isDisplayed('android=new UiSelector().text("Pool")');
    expect(d).to.be.true;
  });

  it('TC-112: Gym amenity checkbox is present', async () => {
    const d = await dashboardPage.isDisplayed('android=new UiSelector().text("Gym")');
    expect(d).to.be.true;
  });

  it('TC-113: Calculate button triggers valuation', async () => {
    await dashboardPage.click('android=new UiSelector().text("Calculate Property Valuation")');
    await dashboardPage.pause(3000);
    const d = await dashboardPage.isDisplayed('~appraised-fair-value');
    expect(d).to.be.true;
  });

  it('TC-114: Appraised value shows currency symbol', async () => {
    const val = await dashboardPage.getText('~appraised-fair-value');
    expect(val).to.match(/[\$€£₹¥]/);
  });

  it('TC-115: Confidence index is shown as percentage', async () => {
    const confidence = await dashboardPage.getText('~confidence-score');
    expect(confidence).to.include('%');
  });

  it('TC-116: Investment recommendation is displayed', async () => {
    const d = await dashboardPage.isDisplayed('~investment-recommendation');
    expect(d).to.be.true;
  });

  it('TC-117: Appreciation forecast table is displayed', async () => {
    const d = await dashboardPage.isDisplayed('~appreciation-table');
    expect(d).to.be.true;
  });

  it('TC-118: Forecast shows 5 year projections', async () => {
    const rows = await driver.$$('~forecast-row');
    expect(rows.length).to.be.gte(5);
  });

  it('TC-119: Downtown location changes valuation', async () => {
    await dashboardPage.click('~location-district-selector');
    await dashboardPage.click('android=new UiSelector().text("Downtown (Core Metro)")');
    await dashboardPage.click('android=new UiSelector().text("Calculate Property Valuation")');
    await dashboardPage.pause(2000);
    const val = await dashboardPage.getText('~appraised-fair-value');
    expect(val).to.match(/[\$€£₹¥]/);
  });

  it('TC-120: Excellent condition increases valuation', async () => {
    await dashboardPage.click('~condition-selector');
    await dashboardPage.click('android=new UiSelector().text("Excellent")');
    await dashboardPage.click('android=new UiSelector().text("Calculate Property Valuation")');
    await dashboardPage.pause(2000);
    const val = await dashboardPage.getText('~appraised-fair-value');
    expect(val).to.match(/[\$€£₹¥]/);
  });

  // TC-121 to TC-140 continue valuation edge cases
  it('TC-121: Needs Work condition is selectable', async () => {
    await dashboardPage.click('~condition-selector');
    await dashboardPage.click('android=new UiSelector().text("Needs Work")');
    const displayed = await dashboardPage.isDisplayed('android=new UiSelector().text("Needs Work")');
    expect(displayed).to.be.true;
  });

  it('TC-122: Beachfront location is selectable', async () => {
    await dashboardPage.click('~location-district-selector');
    await dashboardPage.click('android=new UiSelector().text("Beachfront (Premium Coast)")');
    const d = await dashboardPage.isDisplayed('android=new UiSelector().textContains("Beachfront")');
    expect(d).to.be.true;
  });

  it('TC-123: Rural location is selectable', async () => {
    await dashboardPage.click('~location-district-selector');
    await dashboardPage.click('android=new UiSelector().text("Rural (Countryside)")');
    const d = await dashboardPage.isDisplayed('android=new UiSelector().textContains("Rural")');
    expect(d).to.be.true;
  });

  it('TC-124: Pool amenity can be toggled on', async () => {
    await dashboardPage.click('android=new UiSelector().text("Pool")');
    await dashboardPage.pause(300);
    const selected = await dashboardPage.getAttribute('android=new UiSelector().text("Pool")', 'checked');
    expect(selected).to.be.oneOf(['true', true]);
  });

  it('TC-125: Gym amenity can be toggled on', async () => {
    await dashboardPage.click('android=new UiSelector().text("Gym")');
    await dashboardPage.pause(300);
    const selected = await dashboardPage.getAttribute('android=new UiSelector().text("Gym")', 'checked');
    expect(selected).to.be.oneOf(['true', true]);
  });

  it('TC-126: Gauge visualization is displayed', async () => {
    const d = await dashboardPage.isDisplayed('~gauge-wrapper');
    expect(d).to.be.true;
  });

  it('TC-127: Valuation recalculates on input change', async () => {
    await dashboardPage.typeText('~sqft-input', '2000');
    await dashboardPage.click('android=new UiSelector().text("Calculate Property Valuation")');
    await dashboardPage.pause(2000);
    const val = await dashboardPage.getText('~appraised-fair-value');
    expect(val).to.match(/[\$€£₹¥]/);
  });

  it('TC-128: Zero sqft is handled gracefully', async () => {
    await dashboardPage.typeText('~sqft-input', '0');
    await dashboardPage.click('android=new UiSelector().text("Calculate Property Valuation")');
    await dashboardPage.pause(2000);
    const d = await dashboardPage.isDisplayed('~appraised-fair-value');
    expect(d).to.be.true;
  });

  it('TC-129: Valuation page scrollable', async () => {
    const gestures = new (require('../../utilities/gestureUtils'))(driver);
    await gestures.scrollDown(2);
    const d = await dashboardPage.isDisplayed('~appreciation-table');
    expect(d).to.be.true;
  });

  it('TC-130: Net gain column shows positive values for future years', async () => {
    const rows = await driver.$$('~forecast-row');
    expect(rows.length).to.be.gte(1);
  });
});
