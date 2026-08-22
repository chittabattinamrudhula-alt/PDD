import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/property.dart';

class ApiService {
  static String hostAddress = "10.0.2.2"; // Special host bridging for emulators
  static String port = "5000";
  
  static String get baseUrl => "http://$hostAddress:$port/api";

  static void setHost(String ip) {
    hostAddress = ip;
  }

  // 1. Fetch properties list
  Future<List<Property>> getProperties() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/properties'));
      if (response.statusCode == 200) {
        final List<dynamic> body = jsonDecode(response.body);
        return body.map((item) => Property.fromJson(item)).toList();
      } else {
        throw Exception('Server returned code: ${response.statusCode}');
      }
    } catch (e) {
      print("[ApiService] Error loading properties: $e");
      rethrow;
    }
  }

  // 2. Fetch blockchain ledger list
  Future<List<BlockchainBlock>> getBlockchainLedger() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/blockchain/ledger'));
      if (response.statusCode == 200) {
        final List<dynamic> body = jsonDecode(response.body);
        return body.map((item) => BlockchainBlock.fromJson(item)).toList();
      } else {
        throw Exception('Server returned code: ${response.statusCode}');
      }
    } catch (e) {
      print("[ApiService] Error loading blockchain ledger: $e");
      rethrow;
    }
  }

  // 3. Fetch historical market trends
  Future<Map<String, List<MarketTrendPoint>>> getMarketTrends() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/market/trends'));
      if (response.statusCode == 200) {
        final Map<String, dynamic> body = jsonDecode(response.body);
        final Map<String, List<MarketTrendPoint>> trends = {};
        
        body.forEach((location, list) {
          trends[location] = (list as List)
              .map((item) => MarketTrendPoint.fromJson(item))
              .toList();
        });
        return trends;
      } else {
        throw Exception('Server returned code: ${response.statusCode}');
      }
    } catch (e) {
      print("[ApiService] Error loading market trends: $e");
      rethrow;
    }
  }

  // 4. Calculate instant valuation
  Future<Map<String, dynamic>> predictValuation(Map<String, dynamic> data) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/valuation/predict'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(data),
      );
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Prediction endpoint failed: ${response.statusCode}');
      }
    } catch (e) {
      print("[ApiService] Error predicting valuation: $e");
      rethrow;
    }
  }

  // 5. Publish new listing
  Future<Property> createPropertyListing(Map<String, dynamic> data) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/properties'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(data),
      );
      if (response.statusCode == 201) {
        return Property.fromJson(jsonDecode(response.body));
      } else {
        throw Exception('Create property failed: ${response.statusCode}');
      }
    } catch (e) {
      print("[ApiService] Error creating listing: $e");
      rethrow;
    }
  }

  // Auth Operations

  // 6. User Login
  Future<User> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({"email": email, "password": password}),
      );
      if (response.statusCode == 200) {
        return User.fromJson(jsonDecode(response.body));
      } else {
        final body = jsonDecode(response.body);
        throw Exception(body['error'] ?? 'Login failed.');
      }
    } catch (e) {
      print("[ApiService] Login network error: $e");
      rethrow;
    }
  }

  // 7. User Signup
  Future<User> signup(String email, String password, String name, String role) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/signup'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          "email": email,
          "password": password,
          "name": name,
          "role": role
        }),
      );
      if (response.statusCode == 201) {
        return User.fromJson(jsonDecode(response.body));
      } else {
        final body = jsonDecode(response.body);
        throw Exception(body['error'] ?? 'Registration failed.');
      }
    } catch (e) {
      print("[ApiService] Signup network error: $e");
      rethrow;
    }
  }

  // Booking Operations

  // 8. Create dynamic property reservation (mines Escrow receipt block)
  Future<Booking> bookProperty(String propertyId, String buyerId, String buyerName, String buyerEmail) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/bookings'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          "propertyId": propertyId,
          "buyerId": buyerId,
          "buyerName": buyerName,
          "buyerEmail": buyerEmail
        }),
      );
      if (response.statusCode == 201) {
        return Booking.fromJson(jsonDecode(response.body));
      } else {
        final body = jsonDecode(response.body);
        throw Exception(body['error'] ?? 'Booking failed.');
      }
    } catch (e) {
      print("[ApiService] Book Property network error: $e");
      rethrow;
    }
  }

  // 9. Fetch bookings register
  Future<List<Booking>> getBookings({String? buyerId}) async {
    try {
      String url = '$baseUrl/bookings';
      if (buyerId != null && buyerId.isNotEmpty) {
        url += "?buyerId=$buyerId";
      }
      final response = await http.get(Uri.parse(url));
      if (response.statusCode == 200) {
        final List<dynamic> body = jsonDecode(response.body);
        return body.map((item) => Booking.fromJson(item)).toList();
      } else {
        throw Exception('Server returned code: ${response.statusCode}');
      }
    } catch (e) {
      print("[ApiService] Load Bookings network error: $e");
      rethrow;
    }
  }

  // Admin Vetting Operations

  // 10. Vet / Verify dynamic listings
  Future<Property> vetProperty(String propertyId, bool titleVerified, bool vetAnomalies) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/properties/$propertyId/vet'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          "titleVerified": titleVerified,
          "vetAnomalies": vetAnomalies
        }),
      );
      if (response.statusCode == 200) {
        return Property.fromJson(jsonDecode(response.body));
      } else {
        throw Exception('Vetting update failed: ${response.statusCode}');
      }
    } catch (e) {
      print("[ApiService] Admin Vetting network error: $e");
      rethrow;
    }
  }
}
