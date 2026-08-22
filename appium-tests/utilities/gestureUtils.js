const logger = require('./logger');

class GestureUtils {
  constructor(driver) {
    this.driver = driver;
  }

  async tap(element) {
    await element.click();
    logger.info('Performed TAP');
  }

  async doubleTap(element) {
    const loc = await element.getLocation();
    const size = await element.getSize();
    const x = loc.x + size.width / 2;
    const y = loc.y + size.height / 2;
    await this.driver.touchAction([
      { action: 'tap', x, y },
      { action: 'tap', x, y }
    ]);
    logger.info('Performed DOUBLE TAP');
  }

  async longPress(element, duration = 1500) {
    const loc = await element.getLocation();
    const size = await element.getSize();
    await this.driver.touchAction([
      { action: 'longPress', x: loc.x + size.width / 2, y: loc.y + size.height / 2, duration },
      { action: 'release' }
    ]);
    logger.info(`Performed LONG PRESS for ${duration}ms`);
  }

  async scrollDown(scrolls = 3) {
    const { width, height } = await this.driver.getWindowSize();
    for (let i = 0; i < scrolls; i++) {
      await this.driver.touchAction([
        { action: 'press', x: width / 2, y: height * 0.8 },
        { action: 'moveTo', x: width / 2, y: height * 0.2 },
        { action: 'release' }
      ]);
      await this.driver.pause(500);
    }
    logger.info(`Scrolled DOWN ${scrolls} times`);
  }

  async scrollUp(scrolls = 3) {
    const { width, height } = await this.driver.getWindowSize();
    for (let i = 0; i < scrolls; i++) {
      await this.driver.touchAction([
        { action: 'press', x: width / 2, y: height * 0.2 },
        { action: 'moveTo', x: width / 2, y: height * 0.8 },
        { action: 'release' }
      ]);
      await this.driver.pause(500);
    }
    logger.info(`Scrolled UP ${scrolls} times`);
  }

  async swipeLeft() {
    const { width, height } = await this.driver.getWindowSize();
    await this.driver.touchAction([
      { action: 'press', x: width * 0.8, y: height / 2 },
      { action: 'moveTo', x: width * 0.2, y: height / 2 },
      { action: 'release' }
    ]);
    logger.info('Performed SWIPE LEFT');
  }

  async swipeRight() {
    const { width, height } = await this.driver.getWindowSize();
    await this.driver.touchAction([
      { action: 'press', x: width * 0.2, y: height / 2 },
      { action: 'moveTo', x: width * 0.8, y: height / 2 },
      { action: 'release' }
    ]);
    logger.info('Performed SWIPE RIGHT');
  }

  async dragAndDrop(sourceEl, targetEl) {
    const srcLoc = await sourceEl.getLocation();
    const srcSize = await sourceEl.getSize();
    const tgtLoc = await targetEl.getLocation();
    const tgtSize = await targetEl.getSize();
    await this.driver.touchAction([
      { action: 'longPress', x: srcLoc.x + srcSize.width / 2, y: srcLoc.y + srcSize.height / 2, duration: 1000 },
      { action: 'moveTo', x: tgtLoc.x + tgtSize.width / 2, y: tgtLoc.y + tgtSize.height / 2 },
      { action: 'release' }
    ]);
    logger.info('Performed DRAG AND DROP');
  }

  async pinch(element) {
    const loc = await element.getLocation();
    const size = await element.getSize();
    const cx = loc.x + size.width / 2;
    const cy = loc.y + size.height / 2;
    await this.driver.touchAction([
      [
        { action: 'press', x: cx - 50, y: cy },
        { action: 'moveTo', x: cx - 10, y: cy },
        { action: 'release' }
      ],
      [
        { action: 'press', x: cx + 50, y: cy },
        { action: 'moveTo', x: cx + 10, y: cy },
        { action: 'release' }
      ]
    ]);
    logger.info('Performed PINCH');
  }

  async zoom(element) {
    const loc = await element.getLocation();
    const size = await element.getSize();
    const cx = loc.x + size.width / 2;
    const cy = loc.y + size.height / 2;
    await this.driver.touchAction([
      [
        { action: 'press', x: cx - 10, y: cy },
        { action: 'moveTo', x: cx - 50, y: cy },
        { action: 'release' }
      ],
      [
        { action: 'press', x: cx + 10, y: cy },
        { action: 'moveTo', x: cx + 50, y: cy },
        { action: 'release' }
      ]
    ]);
    logger.info('Performed ZOOM');
  }

  async scrollToText(text) {
    await this.driver.$(`android=new UiScrollable(new UiSelector().scrollable(true)).scrollIntoView(new UiSelector().text("${text}"))`);
    logger.info(`Scrolled to text: "${text}"`);
  }
}

module.exports = GestureUtils;
