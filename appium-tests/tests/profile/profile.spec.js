const { expect } = require('chai');
const DriverFactory = require('../../utilities/driverFactory');
const LoginPage = require('../../pages/LoginPage');
const DashboardPage = require('../../pages/DashboardPage');
const ProfilePage = require('../../pages/ProfilePage');
const ExcelReporter = require('../../utilities/excelReporter');
const ScreenshotUtils = require('../../utilities/screenshotUtils');
const config = require('../../config/appium.config');

describe('[PROFILE] Profile & Currency Tests', function () {
  this.timeout(120000);
  let driver, loginPage, dashboardPage, profilePage;

  before(async () => {
    driver = await DriverFactory.createDriver();
    loginPage = new LoginPage(driver);
    dashboardPage = new DashboardPage(driver);
    profilePage = new ProfilePage(driver);
    await loginPage.navigateToLogin();
    await loginPage.login(config.testData.buyerEmail, config.testData.buyerPassword);
    await dashboardPage.waitForDashboard();
    await dashboardPage.navigateTo('profile');
  });

  after(async () => { await dashboardPage.logout(); await DriverFactory.quitDriver(); });

  afterEach(async function () {
    const status = this.currentTest.state === 'passed' ? 'PASSED' : this.currentTest.state === 'failed' ? 'FAILED' : 'SKIPPED';
    if (status === 'FAILED') {
      const ss = await ScreenshotUtils.captureOnFailure(driver, this.currentTest.title, this.currentTest.err);
      ExcelReporter.addResult({ module: 'Profile', scenario: this.currentTest.title, status, error: this.currentTest.err?.message, screenshotPath: ss });
    } else {
      ExcelReporter.addResult({ module: 'Profile', scenario: this.currentTest.title, status });
    }
  });

  it('TC-131: Profile page title is correct', async () => {
    await profilePage.waitForPage();
    const d = await profilePage.isDisplayed(profilePage.selectors.pageTitle);
    expect(d).to.be.true;
  });

  it('TC-132: Profile avatar is displayed', async () => {
    const d = await profilePage.isDisplayed(profilePage.selectors.avatarInitial);
    expect(d).to.be.true;
  });

  it('TC-133: User email is displayed', async () => {
    const email = await profilePage.getUserEmail();
    expect(email).to.include('@');
  });

  it('TC-134: Display currency is shown', async () => {
    const currency = await profilePage.getDisplayCurrency();
    expect(currency).to.be.a('string').that.is.not.empty;
  });

  it('TC-135: Currency grid is visible', async () => {
    const d = await profilePage.isDisplayed(profilePage.selectors.currencyGrid);
    expect(d).to.be.true;
  });

  it('TC-136: USD currency card is shown', async () => {
    const d = await profilePage.isDisplayed('~currency-card-USD');
    expect(d).to.be.true;
  });

  it('TC-137: EUR currency card is shown', async () => {
    const d = await profilePage.isDisplayed('~currency-card-EUR');
    expect(d).to.be.true;
  });

  it('TC-138: GBP currency card is shown', async () => {
    const d = await profilePage.isDisplayed('~currency-card-GBP');
    expect(d).to.be.true;
  });

  it('TC-139: INR currency card is shown', async () => {
    const d = await profilePage.isDisplayed('~currency-card-INR');
    expect(d).to.be.true;
  });

  it('TC-140: Selecting EUR changes display currency', async () => {
    await profilePage.selectCurrency('EUR');
    await profilePage.pause(1000);
    const currency = await profilePage.getDisplayCurrency();
    expect(currency).to.include('EUR');
  });

  it('TC-141: EUR pill shows in navbar after selection', async () => {
    const pill = await dashboardPage.getCurrencyCode();
    expect(pill).to.include('EUR');
  });

  it('TC-142: Property prices update to EUR on properties tab', async () => {
    await dashboardPage.navigateTo('properties');
    await dashboardPage.pause(1000);
    const price = await dashboardPage.getText('~property-card-0-price');
    expect(price).to.include('€');
  });

  it('TC-143: Selecting INR updates currency', async () => {
    await dashboardPage.navigateTo('profile');
    await profilePage.selectCurrency('INR');
    await profilePage.pause(1000);
    const currency = await profilePage.getDisplayCurrency();
    expect(currency).to.include('INR');
  });

  it('TC-144: Selecting back to USD resets', async () => {
    await profilePage.selectCurrency('USD');
    await profilePage.pause(1000);
    const currency = await profilePage.getDisplayCurrency();
    expect(currency).to.include('USD');
  });

  it('TC-145: Rate table is displayed', async () => {
    const d = await profilePage.isDisplayed(profilePage.selectors.rateTable);
    expect(d).to.be.true;
  });

  it('TC-146: Sign Out button is visible on profile', async () => {
    const d = await profilePage.isDisplayed(profilePage.selectors.signOutBtn);
    expect(d).to.be.true;
  });

  it('TC-147: Sign Out navigates to landing', async () => {
    await profilePage.signOut();
    const d = await profilePage.isDisplayed('android=new UiSelector().text("Portal Login")');
    expect(d).to.be.true;
  });

  it('TC-148: Profile shows user ID', async () => {
    await loginPage.navigateToLogin();
    await loginPage.login(config.testData.buyerEmail, config.testData.buyerPassword);
    await dashboardPage.waitForDashboard();
    await dashboardPage.navigateTo('profile');
    const d = await profilePage.isDisplayed(profilePage.selectors.userId);
    expect(d).to.be.true;
  });

  it('TC-149: Profile shows total bookings for Buyer', async () => {
    const d = await profilePage.isDisplayed('android=new UiSelector().textContains("Total Bookings")');
    expect(d).to.be.true;
  });

  it('TC-150: AED currency card is accessible', async () => {
    const gestures = new (require('../../utilities/gestureUtils'))(driver);
    await gestures.scrollDown(1);
    await profilePage.selectCurrency('AED');
    await profilePage.pause(500);
    const currency = await profilePage.getDisplayCurrency();
    expect(currency).to.include('AED');
    await profilePage.selectCurrency('USD');
  });
});
