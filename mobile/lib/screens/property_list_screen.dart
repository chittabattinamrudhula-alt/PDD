import 'package:flutter/material.dart';
import '../models/property.dart';
import '../services/api_service.dart';

class PropertyListScreen extends StatefulWidget {
  final User? currentUser;
  const PropertyListScreen({super.key, this.currentUser});

  @override
  State<PropertyListScreen> createState() => _PropertyListScreenState();
}

class _PropertyListScreenState extends State<PropertyListScreen> {
  final ApiService _apiService = ApiService();
  List<Property> _properties = [];
  List<Property> _filteredProperties = [];
  bool _isLoading = true;
  String _searchQuery = "";
  String _selectedLocation = "All";

  @override
  void initState() {
    super.initState();
    _fetchProperties();
  }

  Future<void> _fetchProperties() async {
    setState(() {
      _isLoading = true;
    });
    try {
      final data = await _apiService.getProperties();
      setState(() {
        _properties = data;
        _applyFilters();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _applyFilters() {
    setState(() {
      _filteredProperties = _properties.where((p) {
        final matchesSearch = p.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            p.description.toLowerCase().contains(_searchQuery.toLowerCase()) ||
            p.ownerName.toLowerCase().contains(_searchQuery.toLowerCase());
        final matchesLocation = _selectedLocation == "All" || p.location == _selectedLocation;
        return matchesSearch && matchesLocation;
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF080511),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0e0a22),
        elevation: 0,
        title: const Text(
          "Property Registry",
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontFamily: 'Outfit'),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white70),
            onPressed: _fetchProperties,
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Panel
          Container(
            color: const Color(0xFF0e0a22),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 42,
                    child: TextField(
                      style: const TextStyle(color: Colors.white, fontSize: 13),
                      onChanged: (val) {
                        _searchQuery = val;
                        _applyFilters();
                      },
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: const Color(0xFF080511),
                        hintText: "Search title, owner...",
                        hintStyle: const TextStyle(color: Colors.grey, fontSize: 13),
                        prefixIcon: const Icon(Icons.search, color: Colors.grey, size: 18),
                        contentPadding: const EdgeInsets.symmetric(vertical: 0),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: const BorderSide(color: Colors.white10),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                          borderSide: const BorderSide(color: Color(0xFF8B5CF6)),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  height: 42,
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFF080511),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.white10),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      dropdownColor: const Color(0xFF0e0a22),
                      value: _selectedLocation,
                      style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                      items: ["All", "Downtown", "Beachfront", "Uptown", "Suburbs", "Rural"]
                          .map((loc) => DropdownMenuItem(value: loc, child: Text(loc)))
                          .toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setState(() {
                            _selectedLocation = val;
                            _applyFilters();
                          });
                        }
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Properties Listing Area
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF8B5CF6)))
                : _filteredProperties.isEmpty
                    ? const Center(child: Text("No properties match filters.", style: TextStyle(color: Colors.grey)))
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _filteredProperties.length,
                        itemBuilder: (context, index) {
                          final p = _filteredProperties[index];
                          return _buildPropertyListItemCard(p);
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildPropertyListItemCard(Property p) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => PropertyDetailView(
              property: p,
              currentUser: widget.currentUser,
              onRefreshRequest: _fetchProperties,
            ),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.bottom(16),
        decoration: BoxDecoration(
          color: const Color(0xFF0e0a22).withOpacity(0.65),
          border: Border.all(color: const Color(0xFF7000FF).withOpacity(0.15)),
          borderRadius: BorderRadius.circular(16),
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                Image.network(
                  p.imageUrl,
                  height: 150,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (context, _, __) => Container(
                    height: 150, 
                    color: Colors.grey[900], 
                    child: const Icon(Icons.home, color: Colors.white, size: 40)
                  ),
                ),
                Positioned(
                  top: 10,
                  left: 10,
                  right: 10,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: p.blockchainTxHash.isNotEmpty 
                              ? const Color(0xFF10B981).withOpacity(0.9) 
                              : const Color(0xFFF59E0B).withOpacity(0.9),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              p.blockchainTxHash.isNotEmpty ? Icons.verified : Icons.help_outline, 
                              color: Colors.white, 
                              size: 10
                            ),
                            const SizedBox(width: 4),
                            Text(
                              p.blockchainTxHash.isNotEmpty ? "DEED REGISTERED" : "UNREGISTERED",
                              style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: p.isBooked 
                              ? const Color(0xFFEF4444).withOpacity(0.9)
                              : p.anomalies.isSuspicious 
                                  ? const Color(0xFFEF4444).withOpacity(0.9) 
                                  : const Color(0xFF10B981).withOpacity(0.9),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          p.isBooked 
                              ? "RESERVED"
                              : p.anomalies.isSuspicious 
                                  ? "⚠ ANOMALY: ${p.anomalies.anomalyScore}" 
                                  : "CLEAR LISTING",
                          style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        p.location.toUpperCase(),
                        style: const TextStyle(color: Color(0xFF8B5CF6), fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.5),
                      ),
                      Text(
                        "Age: ${p.age} yrs",
                        style: const TextStyle(color: Colors.grey, fontSize: 10),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    p.title,
                    style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold, fontFamily: 'Outfit'),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    "\$${p.listingPrice.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}",
                    style: const TextStyle(color: Color(0xFF06B6D4), fontSize: 18, fontWeight: FontWeight.w800, fontFamily: 'Outfit'),
                  ),
                  const SizedBox(height: 12),
                  
                  // Detail Specs Icons
                  Row(
                    children: [
                      Icon(Icons.crop_square, color: Colors.grey[400], size: 14),
                      const SizedBox(width: 4),
                      Text("${p.sqft} sqft", style: const TextStyle(color: Colors.grey, fontSize: 11)),
                      const SizedBox(width: 16),
                      Icon(Icons.king_bed_outlined, color: Colors.grey[400], size: 14),
                      const SizedBox(width: 4),
                      Text("${p.bedrooms} Beds", style: const TextStyle(color: Colors.grey, fontSize: 11)),
                      const SizedBox(width: 16),
                      Icon(Icons.bathtub_outlined, color: Colors.grey[400], size: 14),
                      const SizedBox(width: 4),
                      Text("${p.bathrooms} Baths", style: const TextStyle(color: Colors.grey, fontSize: 11)),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Quick AI Insight Box
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.02),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.white.withOpacity(0.04)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text("Estimated Value", style: TextStyle(color: Colors.grey, fontSize: 9)),
                            const SizedBox(height: 2),
                            Text(
                              "\$${p.valuation.estimatedValue.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}",
                              style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text("Recommendation", style: TextStyle(color: Colors.grey, fontSize: 9)),
                            const SizedBox(height: 2),
                            Text(
                              p.recommendation.action,
                              style: TextStyle(
                                color: p.recommendation.action == "BUY" ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                                fontSize: 12,
                                fontWeight: FontWeight.bold
                              ),
                            ),
                          ],
                        )
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Property Detailed Audit Page (Stateful to support live updates for book / vet)
class PropertyDetailView extends StatefulWidget {
  final Property property;
  final User? currentUser;
  final VoidCallback onRefreshRequest;

  const PropertyDetailView({
    super.key,
    required this.property,
    this.currentUser,
    required this.onRefreshRequest,
  });

  @override
  State<PropertyDetailView> createState() => _PropertyDetailViewState();
}

class _PropertyDetailViewState extends State<PropertyDetailView> {
  late Property _currentProperty;
  final ApiService _apiService = ApiService();
  bool _actionLoading = false;

  @override
  void initState() {
    super.initState();
    _currentProperty = widget.property;
  }

  Future<void> _bookProperty() async {
    final user = widget.currentUser;
    if (user == null) return;

    setState(() {
      _actionLoading = true;
    });

    try {
      await _apiService.bookProperty(_currentProperty.id, user.id, user.name, user.email);
      
      // Re-fetch all properties to keep state synced
      widget.onRefreshRequest();

      setState(() {
        _currentProperty = Property(
          id: _currentProperty.id,
          title: _currentProperty.title,
          description: _currentProperty.description,
          location: _currentProperty.location,
          sqft: _currentProperty.sqft,
          bedrooms: _currentProperty.bedrooms,
          bathrooms: _currentProperty.bathrooms,
          age: _currentProperty.age,
          condition: _currentProperty.condition,
          amenities: _currentProperty.amenities,
          listingPrice: _currentProperty.listingPrice,
          ownerName: _currentProperty.ownerName,
          titleVerified: _currentProperty.titleVerified,
          blockchainTxHash: _currentProperty.blockchainTxHash,
          blockchainBlockIndex: _currentProperty.blockchainBlockIndex,
          isBooked: true,
          bookedBy: user.id,
          valuation: _currentProperty.valuation,
          recommendation: _currentProperty.recommendation,
          anomalies: _currentProperty.anomalies,
          imageUrl: _currentProperty.imageUrl,
          createdAt: _currentProperty.createdAt,
        );
        _actionLoading = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Booking confirmed! Blockchain receipt block added.")),
      );
    } catch (e) {
      setState(() {
        _actionLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Failed to book property: $e")),
      );
    }
  }

  Future<void> _vetProperty(bool verifyTitle, bool clearAnomalies) async {
    setState(() {
      _actionLoading = true;
    });

    try {
      final updated = await _apiService.vetProperty(_currentProperty.id, verifyTitle, clearAnomalies);
      
      widget.onRefreshRequest();

      setState(() {
        _currentProperty = updated;
        _actionLoading = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Vetting Action recorded! Blockchain database synced.")),
      );
    } catch (e) {
      setState(() {
        _actionLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Failed to vet property: $e")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.currentUser;

    return Scaffold(
      backgroundColor: const Color(0xFF080511),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0e0a22),
        elevation: 0,
        title: const Text(
          "Property Vetting Audit",
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontFamily: 'Outfit'),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Image.network(
              _currentProperty.imageUrl,
              height: 220,
              width: double.infinity,
              fit: BoxFit.cover,
              errorBuilder: (context, _, __) => Container(height: 220, color: Colors.grey[900]),
            ),
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _currentProperty.location.toUpperCase(),
                        style: const TextStyle(color: Color(0xFF8B5CF6), fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        "Created: ${_currentProperty.createdAt.length > 10 ? _currentProperty.createdAt.substring(0, 10) : _currentProperty.createdAt}",
                        style: const TextStyle(color: Colors.grey, fontSize: 11),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _currentProperty.title,
                    style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold, fontFamily: 'Outfit'),
                  ),
                  const SizedBox(height: 8),
                  if (_currentProperty.listingPrice > 0)
                    Text(
                      "\$${_currentProperty.listingPrice.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}",
                      style: const TextStyle(color: Color(0xFF06B6D4), fontSize: 22, fontWeight: FontWeight.w800, fontFamily: 'Outfit'),
                    ),
                  const SizedBox(height: 12),
                  Text(
                    _currentProperty.description,
                    style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 13, height: 1.4),
                  ),
                  const SizedBox(height: 20),

                  // Side-by-side stats
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0e0a22),
                            border: Border.all(color: Colors.white10),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text("PROPERTY METRICS", style: TextStyle(color: Colors.grey, fontSize: 9, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 8),
                              _buildBullet("Size", "${_currentProperty.sqft} sqft"),
                              _buildBullet("Layout", "${_currentProperty.bedrooms} Bed / ${_currentProperty.bathrooms} Bath"),
                              _buildBullet("Age", "${_currentProperty.age} years"),
                              _buildBullet("Condition", _currentProperty.condition),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0e0a22),
                            border: Border.all(color: Colors.white10),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text("AI PREDICTIONS", style: TextStyle(color: Colors.grey, fontSize: 9, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 8),
                              _buildBullet("Appraisal", "\$${_currentProperty.valuation.estimatedValue.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}"),
                              _buildBullet("Confidence", "${_currentProperty.valuation.confidenceScore}%"),
                              _buildBullet("Rating", _currentProperty.recommendation.rating),
                              _buildBullet("Risk Status", _currentProperty.anomalies.status),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Fraud Warnings Panel
                  if (_currentProperty.anomalies.isSuspicious)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      margin: const EdgeInsets.only(bottom: 20),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEF4444).withOpacity(0.05),
                        border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.3)),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: const [
                              Icon(Icons.error_outline, color: Color(0xFFEF4444), size: 18),
                              SizedBox(width: 6),
                              Text(
                                "AI FRAUD SCANS FLAG ALERT",
                                style: TextStyle(color: Color(0xFFEF4444), fontWeight: FontWeight.bold, fontSize: 11),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          ..._currentProperty.anomalies.flags.map((flag) => Padding(
                            padding: const EdgeInsets.only(bottom: 4.0),
                            child: Text("• $flag", style: const TextStyle(color: Color(0xFFFCA5A5), fontSize: 11)),
                          )),
                        ],
                      ),
                    ),

                  // Blockchain Receipts Panel
                  if (_currentProperty.blockchainTxHash.isNotEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      margin: const EdgeInsets.only(bottom: 20),
                      decoration: BoxDecoration(
                        color: const Color(0xFF06B6D4).withOpacity(0.05),
                        border: Border.all(color: const Color(0xFF06B6D4).withOpacity(0.3)),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: const [
                              Icon(Icons.verified_user, color: Color(0xFF06B6D4), size: 18),
                              SizedBox(width: 6),
                              Text(
                                "CRYPTOGRAPHIC BLOCK RECEIPT",
                                style: TextStyle(color: Color(0xFF06B6D4), fontWeight: FontWeight.bold, fontSize: 11),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          _buildReceiptRow("Registrant Entity", _currentProperty.ownerName),
                          _buildReceiptRow("Blockchain Index", "Block #${_currentProperty.blockchainBlockIndex}"),
                          const SizedBox(height: 6),
                          const Text("Cryptographic Signature Hash:", style: TextStyle(color: Colors.grey, fontSize: 10)),
                          const SizedBox(height: 4),
                          Container(
                            padding: const EdgeInsets.all(8),
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: const Color(0xFF080511),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              _currentProperty.blockchainTxHash,
                              style: const TextStyle(color: Color(0xFF06B6D4), fontFamily: 'monospace', fontSize: 9),
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      margin: const EdgeInsets.only(bottom: 20),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF59E0B).withOpacity(0.05),
                        border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.3)),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text(
                        "⚠ Ownership status is currently unverified. Use caution before submitting bookings.",
                        style: TextStyle(color: Color(0xFFF59E0B), fontSize: 12),
                      ),
                    ),

                  // USER ACTIONS
                  if (user != null) ...[
                    const Divider(color: Colors.white10, height: 32),

                    // 1. BUYER ACTION: Book property
                    if (user.role == 'Buyer') ...[
                      SizedBox(
                        width: double.infinity,
                        height: 48,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFEC4899),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          onPressed: (_currentProperty.isBooked || _actionLoading) ? null : _bookProperty,
                          child: _actionLoading
                              ? const CircularProgressIndicator(color: Colors.white)
                              : Text(
                                  _currentProperty.isBooked ? "Reserved Escrow Confirmed" : "Book Property (Title Reservation)",
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                ),
                        ),
                      ),
                    ],

                    // 2. ADMIN ACTION: Vetting box
                    if (user.role == 'Admin') ...[
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0e0a22),
                          border: Border.all(color: const Color(0xFF7000FF).withOpacity(0.2)),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              "ADMIN VETTING ACTIONS",
                              style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 12),
                            if (_actionLoading)
                              const Center(child: CircularProgressIndicator(color: Color(0xFF8B5CF6)))
                            else
                              Row(
                                children: [
                                  if (!_currentProperty.titleVerified)
                                    Expanded(
                                      child: ElevatedButton(
                                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF8B5CF6)),
                                        onPressed: () => _vetProperty(true, false),
                                        child: const Text("Verify Deed", style: TextStyle(color: Colors.white, fontSize: 12)),
                                      ),
                                    ),
                                  if (_currentProperty.anomalies.isSuspicious) ...[
                                    if (!_currentProperty.titleVerified) const SizedBox(width: 8),
                                    Expanded(
                                      child: OutlinedButton(
                                        style: OutlinedButton.styleFrom(side: const BorderSide(color: Color(0xFFEF4444))),
                                        onPressed: () => _vetProperty(false, true),
                                        child: const Text("Clear Anomalies", style: TextStyle(color: Color(0xFFEF4444), fontSize: 12)),
                                      ),
                                    ),
                                  ],
                                  if (_currentProperty.titleVerified && !_currentProperty.anomalies.isSuspicious)
                                    const Text(
                                      "All parameters vetted. Deed active on-chain.",
                                      style: TextStyle(color: Color(0xFF10B981), fontSize: 12),
                                    ),
                                ],
                              ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ],
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildBullet(String title, String val) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4.0),
      child: RichText(
        text: TextSpan(
          text: "$title: ",
          style: const TextStyle(color: Colors.grey, fontSize: 11),
          children: [
            TextSpan(
              text: val,
              style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildReceiptRow(String title, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: const TextStyle(color: Colors.grey, fontSize: 11)),
          Text(value, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
