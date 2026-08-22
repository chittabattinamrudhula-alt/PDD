// AI Valuation and Anomaly Detection Engines

// Location multiplier dictionary
const LOCATION_MULTIPLIERS = {
  "Downtown": 450,      // $450 per sqft
  "Beachfront": 600,    // $600 per sqft
  "Uptown": 350,        // $350 per sqft
  "Suburbs": 220,       // $220 per sqft
  "Rural": 120          // $120 per sqft
};

const AMENITY_PREMIUMS = {
  "pool": 25000,
  "gym": 15000,
  "garden": 10000,
  "smart_home": 12000,
  "garage": 18000
};

/**
 * Predicts the fair market value of a property based on its features.
 */
function estimatePropertyValuation(features) {
  const { sqft, bedrooms, bathrooms, location, age, condition, amenities = [] } = features;

  const basePricePerSqft = LOCATION_MULTIPLIERS[location] || LOCATION_MULTIPLIERS["Suburbs"];
  let estimatedValue = sqft * basePricePerSqft;

  // Add value for bedrooms and bathrooms
  estimatedValue += bedrooms * 15000;
  estimatedValue += bathrooms * 10000;

  // Add premiums for luxury amenities
  amenities.forEach(amenity => {
    if (AMENITY_PREMIUMS[amenity.toLowerCase()]) {
      estimatedValue += AMENITY_PREMIUMS[amenity.toLowerCase()];
    }
  });

  // Apply condition factor
  let conditionFactor = 1.0;
  switch (condition) {
    case "Excellent": conditionFactor = 1.15; break;
    case "Good":      conditionFactor = 1.05; break;
    case "Fair":      conditionFactor = 0.95; break;
    case "Needs Work": conditionFactor = 0.80; break;
  }
  estimatedValue *= conditionFactor;

  // Apply depreciation factor based on age
  // Depreciation caps at 30% reduction (0.7) for older houses
  const ageDepreciation = Math.max(0.7, 1.0 - (age * 0.005));
  estimatedValue *= ageDepreciation;

  // Round valuation
  estimatedValue = Math.round(estimatedValue);

  // Confidence score calculation (90% base, drops slightly with age or fewer specifics)
  let confidenceScore = 95 - (age * 0.2);
  if (sqft < 400 || bedrooms < 1) confidenceScore -= 10;
  confidenceScore = Math.max(70, Math.min(99, Math.round(confidenceScore)));

  // Generate 5-year appreciation projection (between 3% and 8% annually based on location)
  let annualGrowth = 0.04;
  if (location === "Downtown" || location === "Beachfront") annualGrowth = 0.07;
  else if (location === "Rural") annualGrowth = 0.025;

  const projectedValues = [];
  let currentValue = estimatedValue;
  for (let year = 1; year <= 5; year++) {
    currentValue = Math.round(currentValue * (1 + annualGrowth));
    projectedValues.push({ year: 2026 + year, value: currentValue });
  }

  return {
    estimatedValue,
    confidenceScore,
    pricePerSqft: Math.round(estimatedValue / sqft),
    projectedAppreciation: projectedValues,
    growthRatePercent: Math.round(annualGrowth * 1000) / 10
  };
}

/**
 * Determines investment recommendation (Buy, Sell, Hold) by comparing listing price to estimated fair market value.
 */
function getInvestmentRecommendation(listingPrice, estimatedValue) {
  if (!listingPrice) return { action: "HOLD", rating: "Neutral", explanation: "No listing price provided for comparison." };

  const priceRatio = listingPrice / estimatedValue;

  if (priceRatio < 0.85) {
    return {
      action: "BUY",
      rating: "Strong Buy",
      explanation: `Property is undervalued by ${Math.round((1 - priceRatio) * 100)}% compared to local fair market estimates. Strong upside potential.`
    };
  } else if (priceRatio < 0.96) {
    return {
      action: "BUY",
      rating: "Buy",
      explanation: `Property is priced slightly below market value (${Math.round((1 - priceRatio) * 100)}% discount). Favorable investment.`
    };
  } else if (priceRatio <= 1.08) {
    return {
      action: "HOLD",
      rating: "Hold / Fair Value",
      explanation: "Property is priced accurately within fair market value. Recommended for long-term hold or owner-occupant acquisition."
    };
  } else if (priceRatio <= 1.25) {
    return {
      action: "HOLD",
      rating: "Neutral / Overpriced",
      explanation: `Priced ${Math.round((priceRatio - 1) * 100)}% above calculated fair value. Exercise caution, negotiate down, or hold if you already own.`
    };
  } else {
    return {
      action: "SELL",
      rating: "Strong Sell",
      explanation: `Listed at an extreme premium of ${Math.round((priceRatio - 1) * 100)}% above fair value. Excellent time for owners to liquidate; buyers should avoid.`
    };
  }
}

/**
 * Detects suspicious/fraudulent listings by auditing property dimensions, cost profiles, and credentials.
 */
function detectListingAnomalies(property) {
  const { listingPrice, sqft, bedrooms, bathrooms, titleVerified } = property;
  const flags = [];
  let anomalyScore = 0;

  // Run validation checks
  const valuation = estimatePropertyValuation(property);
  const fairValue = valuation.estimatedValue;

  // Rule 1: Price Too Low (Classic scam indicator)
  if (listingPrice && listingPrice < fairValue * 0.5) {
    flags.push("Price is extremely low relative to local market specs (possible bait-and-switch scam).");
    anomalyScore += 45;
  }

  // Rule 2: Price Too High (Unjustified premium)
  if (listingPrice && listingPrice > fairValue * 2.2) {
    flags.push("Price is disproportionately high relative to property features.");
    anomalyScore += 25;
  }

  // Rule 3: Extreme Bed-to-Sqft Layout
  const sqftPerBed = sqft / (bedrooms || 1);
  if (sqftPerBed < 120) {
    flags.push(`Suspiciously dense layout: Only ${Math.round(sqftPerBed)} sqft per bedroom. Possible listing typo or fake structure.`);
    anomalyScore += 30;
  }

  // Rule 4: Bathrooms exceed Bedrooms abnormally
  if (bathrooms > bedrooms + 2 && bedrooms > 0) {
    flags.push(`Irregular bathroom-to-bedroom ratio (${bathrooms} baths for ${bedrooms} beds).`);
    anomalyScore += 15;
  }

  // Rule 5: Ownership Status
  if (!titleVerified) {
    flags.push("Property ownership records not checked or verified on-chain.");
    anomalyScore += 10;
  }

  anomalyScore = Math.min(100, anomalyScore);

  let status = "Clear";
  if (anomalyScore >= 60) {
    status = "High Risk";
  } else if (anomalyScore >= 30) {
    status = "Moderate Warning";
  }

  return {
    anomalyScore,
    flags,
    status,
    isSuspicious: anomalyScore >= 30
  };
}

module.exports = {
  estimatePropertyValuation,
  getInvestmentRecommendation,
  detectListingAnomalies
};
