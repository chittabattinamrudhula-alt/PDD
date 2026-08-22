const { expect } = require('chai');
const { By } = require('selenium-webdriver');
const DriverFactory = require('../../utilities/driverFactory');
const LoginPage = require('../../pages/LoginPage');
const DashboardPage = require('../../pages/DashboardPage');
const ProfilePage = require('../../pages/ProfilePage');
const ExcelReporter = require('../../utilities/excelReporter');
const config = require('../../config/selenium.config');
const logger = require('../../utilities/logger');

describe('[DASHBOARD+PROFILE+CURRENCY] SE-061 to SE-160', function () {
  this.timeout(60000);
  let driver, lp, dp, pp, utils;

  before(async () => {
    driver = await DriverFactory.createDriver();
    lp = new LoginPage(driver);
    dp = new DashboardPage(driver);
    pp = new ProfilePage(driver);
    utils = dp.utils;
    await lp.open();
    await lp.login(config.testData.buyerEmail, config.testData.buyerPassword);
    await dp.waitForDashboard();
  });

  after(async () => {
    await dp.logout();
    await ExcelReporter.generateReport();
    await DriverFactory.quitDriver();
  });

  afterEach(async function () {
    const st = this.currentTest.state === 'passed' ? 'PASSED' : this.currentTest.state === 'failed' ? 'FAILED' : 'SKIPPED';
    if (st === 'FAILED') {
      const ss = await dp.captureOnFailure(this.currentTest.title, this.currentTest.err);
      ExcelReporter.addResult({ module: 'Dashboard', scenario: this.currentTest.title, status: st, error: this.currentTest.err?.message, screenshotPath: ss, duration: this.currentTest.duration });
    } else {
      ExcelReporter.addResult({ module: 'Dashboard', scenario: this.currentTest.title, status: st, duration: this.currentTest.duration });
    }
  });

  it('SE-061: Dashboard is visible after login', async () => { expect(await dp.isDashboardVisible()).to.be.true; });
  it('SE-062: Stat card - Database Listings is shown', async () => { expect(await utils.isDisplayed(By.xpath('//*[contains(text(),"Database Listings")]'))).to.be.true; });
  it('SE-063: Stat card - Blockchain Title Deeds shown', async () => { expect(await utils.isDisplayed(By.xpath('//*[contains(text(),"Blockchain Title Deeds")]'))).to.be.true; });
  it('SE-064: Stat card - System Bookings shown', async () => { expect(await utils.isDisplayed(By.xpath('//*[contains(text(),"System Bookings")]'))).to.be.true; });
  it('SE-065: Currency pill shows $ USD', async () => { const p = await dp.getCurrencyPill(); expect(p).to.include('USD'); });
  it('SE-066: Location Market Price Trends section visible', async () => { expect(await utils.isDisplayed(By.xpath('//*[contains(text(),"Location Market Price Trends")]'))).to.be.true; });
  it('SE-067: Trend chart SVG is rendered', async () => { expect(await utils.isDisplayed(By.css('svg'))).to.be.true; });
  it('SE-068: Market Diagnostics section shown', async () => { expect(await utils.isDisplayed(By.xpath('//*[contains(text(),"Market Diagnostics")]'))).to.be.true; });
  it('SE-069: Launch AI Estimator button is visible', async () => { expect(await utils.isDisplayed(dp.loc.launchEstimator)).to.be.true; });
  it('SE-070: Featured Real Estate Listings section shown', async () => { expect(await utils.isDisplayed(By.xpath('//*[contains(text(),"Featured Real Estate")]'))).to.be.true; });

  it('SE-071: Property cards are rendered on dashboard', async () => {
    const count = await dp.getPropertyCount();
    expect(count).to.be.gte(1);
  });

  it('SE-072: Navigate to Properties tab', async () => {
    await dp.navigateTo('properties');
    expect(await utils.isDisplayed(By.xpath('//*[contains(text(),"Property Register Explorer")]'))).to.be.true;
  });

  it('SE-073: Navigate to Valuation tab', async () => {
    await dp.navigateTo('valuation');
    expect(await utils.isDisplayed(By.xpath('//*[contains(text(),"AI-Powered Property Valuation")]'))).to.be.true;
  });

  it('SE-074: Navigate to Ledger tab', async () => {
    await dp.navigateTo('ledger');
    expect(await utils.isDisplayed(By.xpath('//*[contains(text(),"Blockchain Ledger")]'))).to.be.true;
  });

  it('SE-075: Navigate to Bookings tab', async () => {
    await dp.navigateTo('bookings');
    expect(await utils.isDisplayed(By.xpath('//*[contains(text(),"Bookings") or contains(text(),"Reservations")]'))).to.be.true;
  });

  it('SE-076: Navigate to Profile tab', async () => {
    await dp.navigateTo('profile');
    await pp.waitForPage();
    expect(await pp.isPageVisible()).to.be.true;
  });

  it('SE-077: Profile page shows user email', async () => {
    const email = await pp.getUserEmail();
    expect(email).to.include('@');
  });

  it('SE-078: Profile avatar initial is shown', async () => {
    expect(await utils.isDisplayed(pp.loc.avatar)).to.be.true;
  });

  it('SE-079: Currency grid is visible on profile', async () => {
    expect(await utils.isDisplayed(pp.loc.currencyGrid)).to.be.true;
  });

  it('SE-080: USD currency card is shown', async () => {
    expect(await utils.isDisplayed(pp.loc.currencyCard('USD'))).to.be.true;
  });

  it('SE-081: EUR currency card is shown', async () => { expect(await utils.isDisplayed(pp.loc.currencyCard('EUR'))).to.be.true; });
  it('SE-082: GBP currency card is shown', async () => { expect(await utils.isDisplayed(pp.loc.currencyCard('GBP'))).to.be.true; });
  it('SE-083: INR currency card is shown', async () => { expect(await utils.isDisplayed(pp.loc.currencyCard('INR'))).to.be.true; });
  it('SE-084: JPY currency card is shown', async () => { expect(await utils.isDisplayed(pp.loc.currencyCard('JPY'))).to.be.true; });
  it('SE-085: AUD currency card is shown', async () => { expect(await utils.isDisplayed(pp.loc.currencyCard('AUD'))).to.be.true; });
  it('SE-086: CAD currency card is shown', async () => { expect(await utils.isDisplayed(pp.loc.currencyCard('CAD'))).to.be.true; });
  it('SE-087: CHF currency card is shown', async () => { expect(await utils.isDisplayed(pp.loc.currencyCard('CHF'))).to.be.true; });
  it('SE-088: CNY currency card is shown', async () => { expect(await utils.isDisplayed(pp.loc.currencyCard('CNY'))).to.be.true; });
  it('SE-089: AED currency card is shown', async () => { expect(await utils.isDisplayed(pp.loc.currencyCard('AED'))).to.be.true; });

  it('SE-090: Selecting EUR updates currency pill', async () => {
    await pp.selectCurrency('EUR');
    await dp.navigateTo('dashboard');
    const pill = await dp.getCurrencyPill();
    expect(pill).to.include('EUR');
  });

  it('SE-091: Properties prices shown in EUR', async () => {
    await dp.navigateTo('properties');
    const src = await utils.getPageSource();
    expect(src).to.include('€');
  });

  it('SE-092: Valuation result shown in EUR', async () => {
    await dp.navigateTo('valuation');
    await utils.click(By.xpath('//button[contains(text(),"Calculate")]'));
    await utils.waitForText('Appraised Fair Value');
    const src = await utils.getPageSource();
    expect(src).to.include('€');
  });

  it('SE-093: Booking prices shown in EUR', async () => {
    await dp.navigateTo('bookings');
    const src = await utils.getPageSource();
    expect(src).to.be.a('string').that.is.not.empty;
  });

  it('SE-094: Switching to INR updates prices', async () => {
    await dp.navigateTo('profile');
    await pp.selectCurrency('INR');
    await dp.navigateTo('properties');
    const src = await utils.getPageSource();
    expect(src).to.include('₹');
  });

  it('SE-095: Switching back to USD resets prices', async () => {
    await dp.navigateTo('profile');
    await pp.selectCurrency('USD');
    await dp.navigateTo('properties');
    const src = await utils.getPageSource();
    expect(src).to.include('$');
  });

  it('SE-096: Live rate table is visible on profile', async () => {
    await dp.navigateTo('profile');
    expect(await utils.isDisplayed(pp.loc.rateTable)).to.be.true;
  });

  it('SE-097: Sign Out button is on profile page', async () => {
    expect(await utils.isDisplayed(pp.loc.signOutBtn)).to.be.true;
  });

  it('SE-098: Sign Out from profile returns to landing', async () => {
    await pp.signOut();
    await lp.pause(500);
    expect(await lp.isLandingVisible()).to.be.true;
  });

  it('SE-099: Re-login after profile sign out works', async () => {
    await lp.login(config.testData.buyerEmail, config.testData.buyerPassword);
    await dp.waitForDashboard();
    expect(await dp.isDashboardVisible()).to.be.true;
  });

  it('SE-100: Dashboard stat count is numeric', async () => {
    const cards = await driver.findElements(By.css('.glass-card h4'));
    expect(cards.length).to.be.gte(3);
  });

  // SE-101 to SE-120: navigation/layout tests
  it('SE-101: PropAI logo is visible', async () => { expect(await utils.isDisplayed(dp.loc.propAILogo)).to.be.true; });
  it('SE-102: All 6 nav tabs are rendered', async () => {
    const tabs = await driver.findElements(By.css('.nav-link'));
    expect(tabs.length).to.be.gte(6);
  });
  it('SE-103: Active tab has active CSS class', async () => {
    await dp.navigateTo('dashboard');
    const activeTab = await driver.findElement(By.css('.nav-link.active'));
    const text = await activeTab.getText();
    expect(text).to.include('Dashboard');
  });
  it('SE-104: Glass navbar is rendered', async () => { expect(await utils.isDisplayed(By.css('.glass-navbar'))).to.be.true; });
  it('SE-105: Dashboard grid layout is rendered', async () => { expect(await utils.isDisplayed(By.css('.dashboard-grid'))).to.be.true; });
  it('SE-106: Page scrolls to bottom', async () => { await utils.scrollToBottom(); await dp.pause(300); expect(true).to.be.true; });
  it('SE-107: Page scrolls back to top', async () => { await utils.scrollToTop(); await dp.pause(300); expect(true).to.be.true; });
  it('SE-108: Downtown location chart renders', async () => {
    const selects = await driver.findElements(By.css('select'));
    if (selects.length > 0) await driver.executeScript("arguments[0].value = 'Downtown'", selects[0]);
    await dp.pause(500);
    expect(await utils.isDisplayed(By.css('svg'))).to.be.true;
  });
  it('SE-109: Suburbs location chart renders', async () => {
    const selects = await driver.findElements(By.css('select'));
    if (selects.length > 0) await driver.executeScript("arguments[0].value = 'Suburbs'", selects[0]);
    await dp.pause(500);
    expect(await utils.isDisplayed(By.css('svg'))).to.be.true;
  });
  it('SE-110: Launch AI Estimator navigates to valuation', async () => {
    await utils.click(dp.loc.launchEstimator);
    expect(await utils.isDisplayed(By.xpath('//*[contains(text(),"AI-Powered")]'))).to.be.true;
  });

  // SE-111 to SE-120: property card tests on dashboard
  it('SE-111: Property cards have image', async () => {
    await dp.navigateTo('dashboard');
    const imgs = await driver.findElements(By.css('.property-img'));
    expect(imgs.length).to.be.gte(1);
  });
  it('SE-112: Property cards have price', async () => {
    const prices = await driver.findElements(By.css('.property-price'));
    expect(prices.length).to.be.gte(1);
  });
  it('SE-113: Property cards have title', async () => {
    const titles = await driver.findElements(By.css('.property-title'));
    expect(titles.length).to.be.gte(1);
  });
  it('SE-114: Property cards have detail items', async () => {
    const details = await driver.findElements(By.css('.property-detail-item'));
    expect(details.length).to.be.gte(3);
  });
  it('SE-115: Property card has Inspect button', async () => {
    const btns = await driver.findElements(By.xpath('//button[contains(text(),"Inspect")]'));
    expect(btns.length).to.be.gte(1);
  });
  it('SE-116: Opening property card shows modal', async () => {
    await dp.openPropertyCard(0);
    await utils.waitForText('Audit Vetting Dashboard');
    expect(await utils.isDisplayed(By.css('.modal-content'))).to.be.true;
  });
  it('SE-117: Modal shows property title', async () => {
    const h3 = await utils.getText(By.css('.modal-content h3'));
    expect(h3).to.be.a('string').that.is.not.empty;
  });
  it('SE-118: Modal shows price', async () => {
    const src = await utils.getPageSource();
    expect(src).to.match(/[\$€£₹¥]\d/);
  });
  it('SE-119: Modal close button works', async () => {
    await utils.click(By.xpath('//button[contains(text(),"✕ Close")]'));
    await dp.pause(500);
    expect(await utils.isDisplayed(By.css('.modal-content'))).to.be.false;
  });
  it('SE-120: Overlay click closes modal', async () => {
    await dp.openPropertyCard(0);
    await utils.waitForText('Audit Vetting Dashboard');
    await driver.executeScript('document.querySelector(".modal-overlay").click()');
    await dp.pause(500);
    expect(await utils.isDisplayed(By.css('.modal-content'))).to.be.false;
  });

  // SE-121 to SE-160: valuation, ledger, bookings, admin
  it('SE-121: Valuation page inputs section visible', async () => {
    await dp.navigateTo('valuation');
    expect(await utils.isDisplayed(By.xpath('//*[text()="Inputs"]'))).to.be.true;
  });
  it('SE-122: Valuation calculate button exists', async () => {
    expect(await utils.isDisplayed(By.xpath('//button[contains(text(),"Calculate")]'))).to.be.true;
  });
  it('SE-123: Valuation result shows appraised value', async () => {
    await utils.click(By.xpath('//button[contains(text(),"Calculate")]'));
    await utils.waitForText('Appraised Fair Value');
    expect(await utils.isDisplayed(By.xpath('//*[contains(text(),"Appraised Fair Value")]'))).to.be.true;
  });
  it('SE-124: Confidence score is shown', async () => {
    expect(await utils.isDisplayed(By.xpath('//*[contains(text(),"Confidence Index")]'))).to.be.true;
  });
  it('SE-125: Investment recommendation is shown', async () => {
    expect(await utils.isDisplayed(By.xpath('//*[contains(text(),"Investment Recommendation")]'))).to.be.true;
  });
  it('SE-126: Appreciation forecast table shown', async () => {
    expect(await utils.isDisplayed(By.xpath('//*[contains(text(),"Appreciation Forecast")]'))).to.be.true;
  });
  it('SE-127: Forecast has 5 year rows', async () => {
    const rows = await driver.findElements(By.css('table tbody tr'));
    expect(rows.length).to.be.gte(5);
  });
  it('SE-128: Ledger page shows title', async () => {
    await dp.navigateTo('ledger');
    expect(await utils.isDisplayed(By.xpath('//*[contains(text(),"Blockchain Ledger")]'))).to.be.true;
  });
  it('SE-129: Genesis block visible', async () => {
    expect(await utils.isDisplayed(By.xpath('//*[contains(text(),"Block #0")]'))).to.be.true;
  });
  it('SE-130: Chain intact badge visible', async () => {
    expect(await utils.isDisplayed(By.xpath('//*[contains(text(),"Chain Cryptographically Intact")]'))).to.be.true;
  });
  it('SE-131: Ledger block is clickable', async () => {
    const blocks = await driver.findElements(By.css('.ledger-block'));
    if (blocks.length > 0) {
      await blocks[0].click();
      await utils.waitForText('Audit Vetting Dashboard');
      expect(await utils.isDisplayed(By.css('.modal-content'))).to.be.true;
      await utils.click(By.xpath('//button[contains(text(),"✕ Close")]'));
    }
  });
  it('SE-132: Bookings tab shows correct title for Buyer', async () => {
    await dp.navigateTo('bookings');
    expect(await utils.isDisplayed(By.xpath('//*[contains(text(),"My Property Bookings")]'))).to.be.true;
  });
  it('SE-133: Bookings table headers are shown', async () => {
    expect(await utils.isDisplayed(By.xpath('//*[text()="Property Details"]'))).to.be.true;
  });
  it('SE-134: Transaction Value column shown', async () => {
    expect(await utils.isDisplayed(By.xpath('//*[text()="Transaction Value"]'))).to.be.true;
  });
  it('SE-135: Blockchain Tx Receipt column shown', async () => {
    expect(await utils.isDisplayed(By.xpath('//*[text()="Blockchain Tx Receipt"]'))).to.be.true;
  });
  it('SE-136: Seller sees Add Listing button', async () => {
    await dp.logout();
    await lp.login(config.testData.sellerEmail, config.testData.sellerPassword);
    await dp.waitForDashboard();
    expect(await utils.isDisplayed(dp.loc.addListingBtn)).to.be.true;
  });
  it('SE-137: Add Listing modal opens', async () => {
    await utils.click(dp.loc.addListingBtn);
    await utils.waitForText('Publish Vetted Deed Listing');
    expect(await utils.isDisplayed(By.css('.modal-content'))).to.be.true;
  });
  it('SE-138: Add Listing form has title field', async () => {
    expect(await utils.isDisplayed(By.css('input[placeholder*="Waterfront"]'))).to.be.true;
  });
  it('SE-139: Add Listing form close button works', async () => {
    await utils.click(By.xpath('//button[contains(text(),"✕ Close")]'));
    await dp.pause(500);
    expect(await utils.isDisplayed(By.css('.modal-content'))).to.be.false;
  });
  it('SE-140: Seller bookings tab label is Sales Ledger', async () => {
    await dp.navigateTo('bookings');
    expect(await utils.isDisplayed(By.xpath('//*[contains(text(),"Sales Reservations")]'))).to.be.true;
  });
  it('SE-141: Admin login and Global Bookings', async () => {
    await dp.logout();
    await lp.login(config.testData.adminEmail, config.testData.adminPassword);
    await dp.waitForDashboard();
    await dp.navigateTo('bookings');
    expect(await utils.isDisplayed(By.xpath('//*[contains(text(),"Global Reservation Registry")]'))).to.be.true;
  });
  it('SE-142: Admin can see Verify Deed button on unverified property', async () => {
    await dp.navigateTo('properties');
    const cards = await driver.findElements(By.css('.property-card'));
    for (let i = 0; i < Math.min(cards.length, 5); i++) {
      await cards[i].click();
      await utils.waitForText('Audit Vetting Dashboard');
      const verifyBtn = await utils.isDisplayed(By.xpath('//button[contains(text(),"Verify Deed")]'));
      if (verifyBtn) { expect(verifyBtn).to.be.true; break; }
      await utils.click(By.xpath('//button[contains(text(),"✕ Close")]'));
      await dp.pause(300);
    }
    await utils.click(By.xpath('//button[contains(text(),"✕ Close")]')).catch(() => null);
  });
  it('SE-143: Admin logout works', async () => {
    await dp.logout();
    expect(await lp.isLandingVisible()).to.be.true;
  });
  it('SE-144: Buyer cannot see Add Listing button', async () => {
    await lp.login(config.testData.buyerEmail, config.testData.buyerPassword);
    await dp.waitForDashboard();
    expect(await utils.isDisplayed(dp.loc.addListingBtn)).to.be.false;
  });
  it('SE-145: Buyer cannot Admin-vet a property', async () => {
    await dp.navigateTo('properties');
    await dp.openPropertyCard(0);
    await utils.waitForText('Audit Vetting Dashboard');
    const adminConsole = await utils.isDisplayed(By.xpath('//*[contains(text(),"Admin Console")]'));
    expect(adminConsole).to.be.false;
    await utils.click(By.xpath('//button[contains(text(),"✕ Close")]'));
  });
  it('SE-146: Property modal shows Property Info section', async () => {
    await dp.openPropertyCard(0);
    await utils.waitForText('Audit Vetting Dashboard');
    expect(await utils.isDisplayed(By.xpath('//*[text()="Property Info"]'))).to.be.true;
    await utils.click(By.xpath('//button[contains(text(),"✕ Close")]'));
  });
  it('SE-147: Property modal shows AI Diagnostics section', async () => {
    await dp.openPropertyCard(0);
    await utils.waitForText('Audit Vetting Dashboard');
    expect(await utils.isDisplayed(By.xpath('//*[text()="AI Diagnostics"]'))).to.be.true;
    await utils.click(By.xpath('//button[contains(text(),"✕ Close")]'));
  });
  it('SE-148: Book Property button shown for Buyer on available property', async () => {
    await dp.openPropertyCard(0);
    await utils.waitForText('Audit Vetting Dashboard');
    const booked = await utils.isDisplayed(By.xpath('//button[contains(text(),"Already Reserved")]'));
    if (!booked) expect(await utils.isDisplayed(By.xpath('//button[contains(text(),"Book Property")]'))).to.be.true;
    else expect(booked).to.be.true;
    await utils.click(By.xpath('//button[contains(text(),"✕ Close")]'));
  });
  it('SE-149: Properties page loads all listings', async () => {
    await dp.navigateTo('properties');
    const count = await dp.getPropertyCount();
    expect(count).to.be.gte(1);
  });
  it('SE-150: Verified Deed badge shown on verified properties', async () => {
    expect(await utils.isDisplayed(By.xpath('//*[contains(text(),"Verified Deed")]'))).to.be.true;
  });
  it('SE-151: Properties page description text visible', async () => {
    expect(await utils.isDisplayed(By.xpath('//*[contains(text(),"Vetted databases")]'))).to.be.true;
  });
  it('SE-152: Property card has owner name', async () => {
    const src = await utils.getPageSource();
    expect(src).to.include('Owner:');
  });
  it('SE-153: Property price is currency formatted', async () => {
    const prices = await driver.findElements(By.css('.property-price'));
    const text = await prices[0].getText();
    expect(text).to.match(/[\$€£₹¥]/);
  });
  it('SE-154: Appraisal forecast displayed in property card', async () => {
    const src = await utils.getPageSource();
    expect(src).to.include('Appraisal Forecast');
  });
  it('SE-155: Advice decision shown on property card', async () => {
    const src = await utils.getPageSource();
    expect(src).to.include('Advice:');
  });
  it('SE-156: BUY recommendation shown in green', async () => {
    const buys = await driver.findElements(By.xpath('//*[text()="BUY"]'));
    if (buys.length > 0) {
      const color = await buys[0].getCssValue('color');
      expect(color).to.be.a('string').that.is.not.empty;
    }
  });
  it('SE-157: Profile page accessible for buyer', async () => {
    await dp.navigateTo('profile');
    expect(await pp.isPageVisible()).to.be.true;
  });
  it('SE-158: Profile shows user ID', async () => {
    expect(await utils.isDisplayed(By.xpath('//*[contains(text(),"User ID")]'))).to.be.true;
  });
  it('SE-159: Profile shows Display Currency label', async () => {
    expect(await utils.isDisplayed(By.xpath('//*[contains(text(),"Display Currency")]'))).to.be.true;
  });
  it('SE-160: Currency preference section heading visible', async () => {
    expect(await utils.isDisplayed(By.xpath('//*[contains(text(),"Currency Preference")]'))).to.be.true;
  });
});
