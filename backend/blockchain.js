const crypto = require('crypto');

class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(
        this.index +
          this.previousHash +
          this.timestamp +
          JSON.stringify(this.data) +
          this.nonce
      )
      .digest('hex');
  }

  mineBlock(difficulty) {
    const target = Array(difficulty + 1).join("0");
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log(`[Blockchain] Block successfully mined: ${this.hash} (Nonce: ${this.nonce})`);
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2; // Keep it low for fast mining but still requires validation
  }

  createGenesisBlock() {
    return new Block(
      0,
      new Date('2026-01-01T00:00:00.000Z').toISOString(),
      { message: "Genesis Block - PropAI Title Verification Registry" },
      "0"
    );
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(data) {
    const newBlock = new Block(
      this.chain.length,
      new Date().toISOString(),
      data,
      this.getLatestBlock().hash
    );
    newBlock.mineBlock(this.difficulty);
    this.chain.push(newBlock);
    return newBlock;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Verify block hash calculation integrity
      if (currentBlock.hash !== currentBlock.calculateHash()) {
        console.error(`[Blockchain] Invalid hash found at index ${i}`);
        return false;
      }

      // Verify link chain integrity
      if (currentBlock.previousHash !== previousBlock.hash) {
        console.error(`[Blockchain] Link broken at index ${i}: Current block links to ${currentBlock.previousHash}, but previous was ${previousBlock.hash}`);
        return false;
      }
    }
    return true;
  }

  getPropertyHistory(propertyId) {
    return this.chain
      .filter(block => block.data && block.data.propertyId === propertyId)
      .map(block => ({
        index: block.index,
        timestamp: block.timestamp,
        hash: block.hash,
        previousHash: block.previousHash,
        ownerName: block.data.ownerName,
        purchasePrice: block.data.purchasePrice,
        registrationType: block.data.registrationType || 'Transfer'
      }));
  }
}

module.exports = { Block, Blockchain };
