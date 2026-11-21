'use strict';
const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class LandingPage extends BasePage {
  get loc() {
    return {
      hero:          By.css('.landing-hero'),
      heroTagline:   By.css('.hero-tagline'),
      heroSubtitle:  By.css('.hero-subtitle'),
      registerBtn:   By.xpath('//button[contains(text(),"Register Vetted Account")]'),
      loginBtn:      By.xpath('//button[contains(text(),"Portal Login")]'),
      navLoginBtn:   By.xpath('//button[contains(text(),"Login")]'),
      navSignupBtn:  By.xpath('//button[contains(text(),"Sign Up")]'),
      featureCards:  By.css('.features-grid .glass-card'),
      featureBadges: By.css('.feature-badge'),
      testimonial:   By.xpath('//*[contains(text(),"Secure Your Real Estate")]'),
      propAILogo:    By.css('.nav-logo'),
      navbar:        By.css('.glass-navbar'),
    };
  }

  async open()                    { await super.open(); }
  async isVisible()               { return this.w.isDisplayed(this.loc.heroTagline); }
  async clickRegister()           { await this.w.click(this.loc.registerBtn); }
  async clickPortalLogin()        { await this.w.click(this.loc.loginBtn); }
  async clickNavLogin()           { await this.w.click(this.loc.navLoginBtn); }
  async clickNavSignUp()          { await this.w.click(this.loc.navSignupBtn); }
  async getHeroTagline()          { return this.w.getText(this.loc.heroTagline); }
  async getFeatureCardCount()     { return this.w.countElements(this.loc.featureCards); }
  async isNavbarSticky() {
    const pos = await this.w.getCssValue(this.loc.navbar, 'position');
    return pos === 'sticky' || pos === 'fixed';
  }
}

module.exports = LandingPage;
