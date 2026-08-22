class Property {
  final String id;
  final String title;
  final String description;
  final String location;
  final int sqft;
  final int bedrooms;
  final double bathrooms;
  final int age;
  final String condition;
  final List<String> amenities;
  final int listingPrice;
  final String ownerName;
  final bool titleVerified;
  final String blockchainTxHash;
  final int blockchainBlockIndex;
  final bool isBooked;
  final String bookedBy;
  final PropertyValuation valuation;
  final InvestmentRecommendation recommendation;
  final AnomalyDetails anomalies;
  final String imageUrl;
  final String createdAt;

  Property({
    required this.id,
    required this.title,
    required this.description,
    required this.location,
    required this.sqft,
    required this.bedrooms,
    required this.bathrooms,
    required this.age,
    required this.condition,
    required this.amenities,
    required this.listingPrice,
    required this.ownerName,
    required this.titleVerified,
    required this.blockchainTxHash,
    required this.blockchainBlockIndex,
    required this.isBooked,
    required this.bookedBy,
    required this.valuation,
    required this.recommendation,
    required this.anomalies,
    required this.imageUrl,
    required this.createdAt,
  });

  factory Property.fromJson(Map<String, dynamic> json) {
    return Property(
      id: json['id'] ?? json['_id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      location: json['location'] ?? '',
      sqft: json['sqft'] ?? 0,
      bedrooms: json['bedrooms'] ?? 0,
      bathrooms: (json['bathrooms'] as num?)?.toDouble() ?? 0.0,
      age: json['age'] ?? 0,
      condition: json['condition'] ?? '',
      amenities: List<String>.from(json['amenities'] ?? []),
      listingPrice: json['listingPrice'] ?? 0,
      ownerName: json['ownerName'] ?? '',
      titleVerified: json['titleVerified'] ?? false,
      blockchainTxHash: json['blockchainTxHash'] ?? '',
      blockchainBlockIndex: json['blockchainBlockIndex'] ?? -1,
      isBooked: json['isBooked'] ?? false,
      bookedBy: json['bookedBy'] ?? '',
      valuation: PropertyValuation.fromJson(json['valuation'] ?? {}),
      recommendation: InvestmentRecommendation.fromJson(json['recommendation'] ?? {}),
      anomalies: AnomalyDetails.fromJson(json['anomalies'] ?? {}),
      imageUrl: json['imageUrl'] ?? '',
      createdAt: json['createdAt'] ?? '',
    );
  }
}

class PropertyValuation {
  final int estimatedValue;
  final int confidenceScore;
  final int pricePerSqft;
  final double growthRatePercent;
  final List<ProjectedAppreciation> projectedAppreciation;

  PropertyValuation({
    required this.estimatedValue,
    required this.confidenceScore,
    required this.pricePerSqft,
    required this.growthRatePercent,
    required this.projectedAppreciation,
  });

  factory PropertyValuation.fromJson(Map<String, dynamic> json) {
    var projectedList = json['projectedAppreciation'] as List?;
    List<ProjectedAppreciation> appreciation = projectedList != null
        ? projectedList.map((i) => ProjectedAppreciation.fromJson(i)).toList()
        : [];

    return PropertyValuation(
      estimatedValue: json['estimatedValue'] ?? 0,
      confidenceScore: json['confidenceScore'] ?? 0,
      pricePerSqft: json['pricePerSqft'] ?? 0,
      growthRatePercent: (json['growthRatePercent'] as num?)?.toDouble() ?? 0.0,
      projectedAppreciation: appreciation,
    );
  }
}

class ProjectedAppreciation {
  final int year;
  final int value;

  ProjectedAppreciation({required this.year, required this.value});

  factory ProjectedAppreciation.fromJson(Map<String, dynamic> json) {
    return ProjectedAppreciation(
      year: json['year'] ?? 0,
      value: json['value'] ?? 0,
    );
  }
}

class InvestmentRecommendation {
  final String action;
  final String rating;
  final String explanation;

  InvestmentRecommendation({
    required this.action,
    required this.rating,
    required this.explanation,
  });

  factory InvestmentRecommendation.fromJson(Map<String, dynamic> json) {
    return InvestmentRecommendation(
      action: json['action'] ?? 'HOLD',
      rating: json['rating'] ?? 'Neutral',
      explanation: json['explanation'] ?? '',
    );
  }
}

class AnomalyDetails {
  final int anomalyScore;
  final String status;
  final List<String> flags;
  final bool isSuspicious;

  AnomalyDetails({
    required this.anomalyScore,
    required this.status,
    required this.flags,
    required this.isSuspicious,
  });

  factory AnomalyDetails.fromJson(Map<String, dynamic> json) {
    return AnomalyDetails(
      anomalyScore: json['anomalyScore'] ?? 0,
      status: json['status'] ?? 'Clear',
      flags: List<String>.from(json['flags'] ?? []),
      isSuspicious: json['isSuspicious'] ?? false,
    );
  }
}

class BlockchainBlock {
  final int index;
  final String timestamp;
  final String hash;
  final String previousHash;
  final int nonce;
  final Map<String, dynamic> data;

  BlockchainBlock({
    required this.index,
    required this.timestamp,
    required this.hash,
    required this.previousHash,
    required this.nonce,
    required this.data,
  });

  factory BlockchainBlock.fromJson(Map<String, dynamic> json) {
    return BlockchainBlock(
      index: json['index'] ?? 0,
      timestamp: json['timestamp'] ?? '',
      hash: json['hash'] ?? '',
      previousHash: json['previousHash'] ?? '',
      nonce: json['nonce'] ?? 0,
      data: Map<String, dynamic>.from(json['data'] ?? {}),
    );
  }
}

class MarketTrendPoint {
  final int year;
  final int pricePerSqft;
  final int volume;

  MarketTrendPoint({
    required this.year,
    required this.pricePerSqft,
    required this.volume,
  });

  factory MarketTrendPoint.fromJson(Map<String, dynamic> json) {
    return MarketTrendPoint(
      year: json['year'] ?? 0,
      pricePerSqft: json['pricePerSqft'] ?? 0,
      volume: json['volume'] ?? 0,
    );
  }
}

class User {
  final String id;
  final String email;
  final String name;
  final String role; // 'Buyer' | 'Seller' | 'Admin'

  User({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? json['_id'] ?? '',
      email: json['email'] ?? '',
      name: json['name'] ?? '',
      role: json['role'] ?? 'Buyer',
    );
  }
}

class Booking {
  final String id;
  final String propertyId;
  final String propertyTitle;
  final String propertyLocation;
  final String buyerId;
  final String buyerName;
  final String buyerEmail;
  final int price;
  final String bookingDate;
  final String blockchainTxHash;
  final int blockchainBlockIndex;

  Booking({
    required this.id,
    required this.propertyId,
    required this.propertyTitle,
    required this.propertyLocation,
    required this.buyerId,
    required this.buyerName,
    required this.buyerEmail,
    required this.price,
    required this.bookingDate,
    required this.blockchainTxHash,
    required this.blockchainBlockIndex,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: json['id'] ?? json['_id'] ?? '',
      propertyId: json['propertyId'] ?? '',
      propertyTitle: json['propertyTitle'] ?? '',
      propertyLocation: json['propertyLocation'] ?? '',
      buyerId: json['buyerId'] ?? '',
      buyerName: json['buyerName'] ?? '',
      buyerEmail: json['buyerEmail'] ?? '',
      price: json['price'] ?? 0,
      bookingDate: json['bookingDate'] ?? '',
      blockchainTxHash: json['blockchainTxHash'] ?? '',
      blockchainBlockIndex: json['blockchainBlockIndex'] ?? -1,
    );
  }
}
