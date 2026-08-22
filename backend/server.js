const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const { Blockchain } = require('./blockchain');
const { estimatePropertyValuation, getInvestmentRecommendation, detectListingAnomalies } = require('./ai_models');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Blockchain
const propBlockchain = new Blockchain();

// Fallback JSON File Paths
const PROPERTIES_FILE = path.join(__dirname, 'db_properties.json');
const LEDGER_FILE = path.join(__dirname, 'db_blockchain.json');
const USERS_FILE = path.join(__dirname, 'db_users.json');
const BOOKINGS_FILE = path.join(__dirname, 'db_bookings.json');

// Mongoose Schemas (if MongoDB is connected)
const PropertySchema = new mongoose.Schema({
  title: String,
  description: String,
  location: String,
  sqft: Number,
  bedrooms: Number,
  bathrooms: Number,
  age: Number,
  condition: String,
  amenities: [String],
  listingPrice: Number,
  ownerName: String,
  titleVerified: { type: Boolean, default: false },
  blockchainTxHash: { type: String, default: "" },
  blockchainBlockIndex: { type: Number, default: -1 },
  isBooked: { type: Boolean, default: false },
  bookedBy: { type: String, default: "" },
  valuation: {
    estimatedValue: Number,
    confidenceScore: Number,
    pricePerSqft: Number,
    growthRatePercent: Number
  },
  recommendation: {
    action: String,
    rating: String,
    explanation: String
  },
  anomalies: {
    anomalyScore: Number,
    status: String,
    flags: [String],
    isSuspicious: Boolean
  },
  imageUrl: String,
  createdAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['Buyer', 'Seller', 'Admin'], required: true },
  createdAt: { type: Date, default: Date.now }
});

const BookingSchema = new mongoose.Schema({
  propertyId: { type: String, required: true },
  propertyTitle: { type: String, required: true },
  propertyLocation: { type: String, required: true },
  buyerId: { type: String, required: true },
  buyerName: { type: String, required: true },
  buyerEmail: { type: String, required: true },
  price: { type: Number, required: true },
  bookingDate: { type: Date, default: Date.now },
  blockchainTxHash: { type: String, default: "" },
  blockchainBlockIndex: { type: Number, default: -1 }
});

let PropertyModel;
let UserModel;
let BookingModel;
let useMongoDB = false;

// Seed properties data
const SEED_PROPERTIES = [
  {
    title: "Skyline Luxury Penthouse",
    description: "Stunning top-floor apartment with panoramic skyline views, fully integrated automation, and private fitness studio access.",
    location: "Downtown",
    sqft: 1800,
    bedrooms: 2,
    bathrooms: 2,
    age: 3,
    condition: "Excellent",
    amenities: ["pool", "gym", "smart_home"],
    listingPrice: 890000,
    ownerName: "Satoshi Nakamoto",
    titleVerified: true,
    isBooked: false,
    imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80"
  },
  {
    title: "Oakridge Family Residence",
    description: "Spacious suburban home featuring a private landscaped garden, renovated chef's kitchen, and a double detached garage.",
    location: "Suburbs",
    sqft: 2400,
    bedrooms: 4,
    bathrooms: 3,
    age: 8,
    condition: "Good",
    amenities: ["garden", "garage"],
    listingPrice: 530000,
    ownerName: "Sam Seller",
    titleVerified: true,
    isBooked: false,
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"
  },
  {
    title: "Sapphire Shore Beach Resort",
    description: "Premium beachfront escape with direct access to private sands, high ceilings, and beautiful resort amenities.",
    location: "Beachfront",
    sqft: 1200,
    bedrooms: 1,
    bathrooms: 1.5,
    age: 12,
    condition: "Excellent",
    amenities: ["pool", "gym", "garden"],
    listingPrice: 850000,
    ownerName: "Vitalik Buterin",
    titleVerified: true,
    isBooked: false,
    imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80"
  },
  {
    title: "Suspicious Meadow Manor",
    description: "Huge rural property with historical build qualities. Price set for extremely quick sale by remote agent.",
    location: "Rural",
    sqft: 4500,
    bedrooms: 9,
    bathrooms: 1,
    age: 45,
    condition: "Needs Work",
    amenities: [],
    listingPrice: 65000,
    ownerName: "Anonymous Agent",
    titleVerified: false,
    isBooked: false,
    imageUrl: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80"
  },
  {
    title: "Grandview Highrise Apartment",
    description: "Sleek metropolitan condo located in the heart of Uptown. Modern finishes, custom lighting, and automated temperature controls.",
    location: "Uptown",
    sqft: 1050,
    bedrooms: 2,
    bathrooms: 2,
    age: 2,
    condition: "Excellent",
    amenities: ["smart_home", "gym"],
    listingPrice: 380000,
    ownerName: "Grace Hopper",
    titleVerified: true,
    isBooked: false,
    imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"
  }
];

// Seed user accounts data
const SEED_USERS = [
  {
    email: "buyer@propai.com",
    password: "password",
    name: "Bob Buyer",
    role: "Buyer"
  },
  {
    email: "seller@propai.com",
    password: "password",
    name: "Sam Seller",
    role: "Seller"
  },
  {
    email: "admin@propai.com",
    password: "password",
    name: "Alice Admin",
    role: "Admin"
  }
];

// Helper to interact with local JSON files
function readJSONFile(filePath, defaultData = []) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultData;
  }
}

function writeJSONFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing to ${filePath}:`, err);
  }
}

// Populate local JSON DB if empty
function initializeLocalDB() {
  const localProperties = readJSONFile(PROPERTIES_FILE, []);
  if (localProperties.length === 0) {
    console.log("[Database] Seeding initial properties to JSON database...");
    const initialized = SEED_PROPERTIES.map(p => {
      const valInfo = estimatePropertyValuation(p);
      const recInfo = getInvestmentRecommendation(p.listingPrice, valInfo.estimatedValue);
      const anomalyInfo = detectListingAnomalies(p);

      let txHash = "";
      let blockIndex = -1;
      if (p.titleVerified) {
        const block = propBlockchain.addBlock({
          propertyId: p.title.replace(/\s+/g, '-').toLowerCase(),
          propertyName: p.title,
          ownerName: p.ownerName,
          purchasePrice: p.listingPrice,
          registrationType: "Initial Deed Registration"
        });
        txHash = block.hash;
        blockIndex = block.index;
      }

      return {
        id: Math.random().toString(36).substring(2, 9),
        ...p,
        blockchainTxHash: txHash,
        blockchainBlockIndex: blockIndex,
        valuation: {
          estimatedValue: valInfo.estimatedValue,
          confidenceScore: valInfo.confidenceScore,
          pricePerSqft: valInfo.pricePerSqft,
          growthRatePercent: valInfo.growthRatePercent
        },
        recommendation: recInfo,
        anomalies: anomalyInfo,
        createdAt: new Date().toISOString()
      };
    });
    writeJSONFile(PROPERTIES_FILE, initialized);
    writeJSONFile(LEDGER_FILE, propBlockchain.chain);
  } else {
    const savedChain = readJSONFile(LEDGER_FILE, []);
    if (savedChain.length > 0) {
      propBlockchain.chain = savedChain;
    }
  }

  // Seed Users
  const localUsers = readJSONFile(USERS_FILE, []);
  if (localUsers.length === 0) {
    console.log("[Database] Seeding default credentials to JSON...");
    const mappedUsers = SEED_USERS.map(u => ({
      id: Math.random().toString(36).substring(2, 9),
      ...u,
      createdAt: new Date().toISOString()
    }));
    writeJSONFile(USERS_FILE, mappedUsers);
  }

  // Create Bookings file if not exists
  readJSONFile(BOOKINGS_FILE, []);
}

// Connect to Database
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/propai')
  .then(() => {
    console.log('[Database] MongoDB successfully connected.');
    PropertyModel = mongoose.model('Property', PropertySchema);
    UserModel = mongoose.model('User', UserSchema);
    BookingModel = mongoose.model('Booking', BookingSchema);
    useMongoDB = true;
    
    // Seed MongoDB if empty
    UserModel.countDocuments().then(count => {
      if (count === 0) {
        console.log('[Database] Seeding initial schemas to MongoDB...');
        initializeLocalDB();
        
        // Seed users
        const localUsers = readJSONFile(USERS_FILE);
        UserModel.insertMany(localUsers);

        // Seed properties
        const localProps = readJSONFile(PROPERTIES_FILE);
        PropertyModel.insertMany(localProps);
      }
    });
  })
  .catch(err => {
    console.warn(`[Database] MongoDB connection failed. Defaulting to JSON file fallback database.`);
    useMongoDB = false;
    initializeLocalDB();
  });

// API Routes

// 1. Get properties
app.get('/api/properties', async (req, res) => {
  try {
    if (useMongoDB) {
      const properties = await PropertyModel.find().sort({ createdAt: -1 });
      return res.json(properties);
    } else {
      const properties = readJSONFile(PROPERTIES_FILE);
      properties.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json(properties);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to load properties list." });
  }
});

// 2. Add property listing
app.post('/api/properties', async (req, res) => {
  try {
    const propertyData = req.body;
    
    const valInfo = estimatePropertyValuation(propertyData);
    const recInfo = getInvestmentRecommendation(propertyData.listingPrice, valInfo.estimatedValue);
    const anomalyInfo = detectListingAnomalies(propertyData);

    let txHash = "";
    let blockIndex = -1;

    if (propertyData.titleVerified) {
      const propertyId = propertyData.title.replace(/\s+/g, '-').toLowerCase() + '-' + Math.round(Math.random() * 1000);
      const block = propBlockchain.addBlock({
        propertyId,
        propertyName: propertyData.title,
        ownerName: propertyData.ownerName,
        purchasePrice: propertyData.listingPrice,
        registrationType: "Initial Deed Registration"
      });
      txHash = block.hash;
      blockIndex = block.index;

      if (!useMongoDB) {
        writeJSONFile(LEDGER_FILE, propBlockchain.chain);
      }
    }

    const payload = {
      ...propertyData,
      blockchainTxHash: txHash,
      blockchainBlockIndex: blockIndex,
      isBooked: false,
      bookedBy: "",
      valuation: {
        estimatedValue: valInfo.estimatedValue,
        confidenceScore: valInfo.confidenceScore,
        pricePerSqft: valInfo.pricePerSqft,
        growthRatePercent: valInfo.growthRatePercent
      },
      recommendation: recInfo,
      anomalies: anomalyInfo,
      createdAt: new Date().toISOString()
    };

    if (useMongoDB) {
      const newProperty = new PropertyModel(payload);
      await newProperty.save();
      res.status(201).json(newProperty);
    } else {
      const properties = readJSONFile(PROPERTIES_FILE);
      payload.id = Math.random().toString(36).substring(2, 9);
      properties.push(payload);
      writeJSONFile(PROPERTIES_FILE, properties);
      res.status(201).json(payload);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to publish property listing." });
  }
});

// 3. Admin Vetting property (mines deed / overrides anomalies)
app.put('/api/properties/:id/vet', async (req, res) => {
  try {
    const propertyId = req.params.id;
    const { titleVerified, vetAnomalies } = req.body;

    let targetProp;

    if (useMongoDB) {
      targetProp = await PropertyModel.findById(propertyId);
    } else {
      const properties = readJSONFile(PROPERTIES_FILE);
      targetProp = properties.find(p => p.id === propertyId);
    }

    if (!targetProp) {
      return res.status(404).json({ error: "Property not found." });
    }

    // Update fields
    if (titleVerified && !targetProp.titleVerified) {
      targetProp.titleVerified = true;
      const bId = targetProp.title?.replace(/\s+/g, '-').toLowerCase() || 'deed';
      const block = propBlockchain.addBlock({
        propertyId: bId,
        propertyName: targetProp.title,
        ownerName: targetProp.ownerName,
        purchasePrice: targetProp.listingPrice,
        registrationType: "Vetted Deed Registration"
      });
      targetProp.blockchainTxHash = block.hash;
      targetProp.blockchainBlockIndex = block.index;
      
      if (!useMongoDB) {
        writeJSONFile(LEDGER_FILE, propBlockchain.chain);
      }
    }

    if (vetAnomalies) {
      targetProp.anomalies = {
        anomalyScore: 0,
        status: "Clear (Vetted by Admin)",
        flags: [],
        isSuspicious: false
      };
    }

    if (useMongoDB) {
      await targetProp.save();
      res.json(targetProp);
    } else {
      const properties = readJSONFile(PROPERTIES_FILE);
      const idx = properties.findIndex(p => p.id === propertyId);
      properties[idx] = targetProp;
      writeJSONFile(PROPERTIES_FILE, properties);
      res.json(targetProp);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to vet property listings." });
  }
});

// 4. Instant AI prediction
app.post('/api/valuation/predict', (req, res) => {
  try {
    const features = req.body;
    const valuation = estimatePropertyValuation(features);
    const recommendation = getInvestmentRecommendation(features.listingPrice, valuation.estimatedValue);
    const anomalies = detectListingAnomalies({
      ...features,
      titleVerified: features.titleVerified || false
    });
    res.json({ valuation, recommendation, anomalies });
  } catch (error) {
    res.status(500).json({ error: "Failed to execute AI model prediction." });
  }
});

// 5. Blockchain registry
app.get('/api/blockchain/ledger', (req, res) => {
  res.json(propBlockchain.chain);
});

// 6. Market trends
app.get('/api/market/trends', (req, res) => {
  const trends = {
    Downtown: [
      { year: 2021, pricePerSqft: 340, volume: 145 },
      { year: 2022, pricePerSqft: 380, volume: 180 },
      { year: 2023, pricePerSqft: 410, volume: 160 },
      { year: 2024, pricePerSqft: 435, volume: 195 },
      { year: 2025, pricePerSqft: 450, volume: 220 }
    ],
    Beachfront: [
      { year: 2021, pricePerSqft: 480, volume: 60 },
      { year: 2022, pricePerSqft: 520, volume: 75 },
      { year: 2023, pricePerSqft: 550, volume: 70 },
      { year: 2024, pricePerSqft: 580, volume: 85 },
      { year: 2025, pricePerSqft: 600, volume: 90 }
    ],
    Uptown: [
      { year: 2021, pricePerSqft: 280, volume: 95 },
      { year: 2022, pricePerSqft: 300, volume: 110 },
      { year: 2023, pricePerSqft: 320, volume: 105 },
      { year: 2024, pricePerSqft: 335, volume: 130 },
      { year: 2025, pricePerSqft: 350, volume: 150 }
    ],
    Suburbs: [
      { year: 2021, pricePerSqft: 180, volume: 320 },
      { year: 2022, pricePerSqft: 195, volume: 340 },
      { year: 2023, pricePerSqft: 205, volume: 310 },
      { year: 2024, pricePerSqft: 212, volume: 330 },
      { year: 2025, pricePerSqft: 220, volume: 360 }
    ],
    Rural: [
      { year: 2021, pricePerSqft: 110, volume: 80 },
      { year: 2022, pricePerSqft: 114, volume: 85 },
      { year: 2023, pricePerSqft: 116, volume: 75 },
      { year: 2024, pricePerSqft: 118, volume: 90 },
      { year: 2025, pricePerSqft: 120, volume: 95 }
    ]
  };
  res.json(trends);
});

// Auth Routes

// 7. Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (useMongoDB) {
      const user = await UserModel.findOne({ email, password });
      if (!user) return res.status(401).json({ error: "Invalid email or password credentials." });
      return res.json({ id: user._id, email: user.email, name: user.name, role: user.role });
    } else {
      const users = readJSONFile(USERS_FILE);
      const user = users.find(u => u.email === email && u.password === password);
      if (!user) return res.status(401).json({ error: "Invalid email or password credentials." });
      return res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
    }
  } catch (error) {
    res.status(500).json({ error: "Login authentication process failed." });
  }
});

// 8. Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (useMongoDB) {
      const exists = await UserModel.findOne({ email });
      if (exists) return res.status(400).json({ error: "Account with email already exists." });
      
      const newUser = new UserModel({ email, password, name, role });
      await newUser.save();
      res.status(201).json({ id: newUser._id, email: newUser.email, name: newUser.name, role: newUser.role });
    } else {
      const users = readJSONFile(USERS_FILE);
      const exists = users.find(u => u.email === email);
      if (exists) return res.status(400).json({ error: "Account with email already exists." });

      const newUser = {
        id: Math.random().toString(36).substring(2, 9),
        email,
        password,
        name,
        role,
        createdAt: new Date().toISOString()
      };
      users.push(newUser);
      writeJSONFile(USERS_FILE, users);
      res.status(201).json({ id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role });
    }
  } catch (error) {
    res.status(500).json({ error: "Signup registration process failed." });
  }
});

// Bookings Routes

// 9. Book a property listing (mines dynamic receipt block on chain)
app.post('/api/bookings', async (req, res) => {
  try {
    const { propertyId, buyerId, buyerName, buyerEmail } = req.body;

    let property;
    if (useMongoDB) {
      property = await PropertyModel.findById(propertyId);
    } else {
      const properties = readJSONFile(PROPERTIES_FILE);
      property = properties.find(p => p.id === propertyId);
    }

    if (!property) return res.status(404).json({ error: "Property listing not found." });
    if (property.isBooked) return res.status(400).json({ error: "Property has already been booked." });

    // Mine receipt block on blockchain
    const block = propBlockchain.addBlock({
      propertyId: property.id || property._id.toString(),
      propertyName: property.title,
      ownerName: buyerName,
      purchasePrice: property.listingPrice,
      registrationType: "Title Reservation / Booking Recipt"
    });

    // Update property
    property.isBooked = true;
    property.bookedBy = buyerId;

    const bookingPayload = {
      propertyId: property.id || property._id.toString(),
      propertyTitle: property.title,
      propertyLocation: property.location,
      buyerId,
      buyerName,
      buyerEmail,
      price: property.listingPrice,
      blockchainTxHash: block.hash,
      blockchainBlockIndex: block.index,
      bookingDate: new Date().toISOString()
    };

    if (useMongoDB) {
      await property.save();
      const newBooking = new BookingModel(bookingPayload);
      await newBooking.save();
      
      res.status(201).json(newBooking);
    } else {
      // Save property update
      const properties = readJSONFile(PROPERTIES_FILE);
      const idx = properties.findIndex(p => p.id === propertyId);
      properties[idx] = property;
      writeJSONFile(PROPERTIES_FILE, properties);

      // Save booking record
      const bookings = readJSONFile(BOOKINGS_FILE);
      bookingPayload.id = Math.random().toString(36).substring(2, 9);
      bookings.push(bookingPayload);
      writeJSONFile(BOOKINGS_FILE, bookings);

      // Save blockchain state
      writeJSONFile(LEDGER_FILE, propBlockchain.chain);

      res.status(201).json(bookingPayload);
    }
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({ error: "Failed to record property reservation booking." });
  }
});

// 10. Get bookings list
app.get('/api/bookings', async (req, res) => {
  try {
    const { buyerId } = req.query;

    if (useMongoDB) {
      let query = {};
      if (buyerId) query = { buyerId };
      const bookings = await BookingModel.find(query).sort({ bookingDate: -1 });
      res.json(bookings);
    } else {
      const bookings = readJSONFile(BOOKINGS_FILE);
      let filtered = bookings;
      if (buyerId) {
        filtered = bookings.filter(b => b.buyerId === buyerId);
      }
      filtered.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
      res.json(filtered);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to load bookings register." });
  }
});

app.listen(PORT, () => {
  console.log(`[Server] PropAI Node.js Backend service running on http://localhost:${PORT}`);
});
