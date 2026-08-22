import 'package:flutter/material.dart';
import 'dart:math' as math;
import '../services/api_service.dart';

class ValuationScreen extends StatefulWidget {
  const ValuationScreen({super.key});

  @override
  State<ValuationScreen> createState() => _ValuationScreenState();
}

class _ValuationScreenState extends State<ValuationScreen> {
  final ApiService _apiService = ApiService();
  bool _isCalculating = false;
  Map<String, dynamic>? _result;

  // Form fields
  String _selectedLocation = "Downtown";
  double _age = 5;
  double _sqft = 1200;
  String _condition = "Excellent";
  int _bedrooms = 2;
  double _bathrooms = 2.0;
  final TextEditingController _priceController = TextEditingController(text: "500000");

  final List<String> _selectedAmenities = [];

  @override
  void initState() {
    super.initState();
    _triggerCalculation();
  }

  Future<void> _triggerCalculation() async {
    setState(() {
      _isCalculating = true;
    });

    final payload = {
      "location": _selectedLocation,
      "sqft": _sqft.toInt(),
      "bedrooms": _bedrooms,
      "bathrooms": _bathrooms,
      "age": _age.toInt(),
      "condition": _condition,
      "amenities": _selectedAmenities,
      "listingPrice": int.tryParse(_priceController.text.trim()) ?? 0,
    };

    try {
      final res = await _apiService.predictValuation(payload);
      setState(() {
        _result = res;
        _isCalculating = false;
      });
    } catch (e) {
      setState(() {
        _isCalculating = false;
      });
    }
  }

  void _toggleAmenity(String name) {
    setState(() {
      if (_selectedAmenities.contains(name)) {
        _selectedAmenities.remove(name);
      } else {
        _selectedAmenities.add(name);
      }
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
          "AI Valuation Calculator",
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontFamily: 'Outfit'),
        ),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Form card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF0e0a22).withOpacity(0.65),
                  border: Border.all(color: const Color(0xFF7000FF).withOpacity(0.15)),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      "Property Spec Dimensions",
                      style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold, fontFamily: 'Outfit'),
                    ),
                    const SizedBox(height: 16),

                    // Location Selector
                    _buildLabel("Location District"),
                    DropdownButtonFormField<String>(
                      dropdownColor: const Color(0xFF0e0a22),
                      value: _selectedLocation,
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                      decoration: _inputDecoration(),
                      items: ["Downtown", "Beachfront", "Uptown", "Suburbs", "Rural"]
                          .map((loc) => DropdownMenuItem(value: loc, child: Text(loc)))
                          .toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setState(() {
                            _selectedLocation = val;
                          });
                        }
                      },
                    ),
                    const SizedBox(height: 14),

                    // Area size slider
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildLabel("Area Size (Sqft)"),
                        Text("${_sqft.toInt()} sqft", style: const TextStyle(color: Color(0xFF06B6D4), fontSize: 13, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    Slider(
                      value: _sqft,
                      min: 300,
                      max: 6000,
                      divisions: 57,
                      activeColor: const Color(0xFF8B5CF6),
                      inactiveColor: Colors.white10,
                      onChanged: (val) {
                        setState(() {
                          _sqft = val;
                        });
                      },
                    ),
                    const SizedBox(height: 8),

                    // Age slider
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildLabel("Building Age (Years)"),
                        Text("${_age.toInt()} yrs", style: const TextStyle(color: Color(0xFF06B6D4), fontSize: 13, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    Slider(
                      value: _age,
                      min: 0,
                      max: 80,
                      divisions: 80,
                      activeColor: const Color(0xFF8B5CF6),
                      inactiveColor: Colors.white10,
                      onChanged: (val) {
                        setState(() {
                          _age = val;
                        });
                      },
                    ),
                    const SizedBox(height: 8),

                    // Beds and Baths rows
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel("Bedrooms"),
                              DropdownButtonFormField<int>(
                                dropdownColor: const Color(0xFF0e0a22),
                                value: _bedrooms,
                                style: const TextStyle(color: Colors.white),
                                decoration: _inputDecoration(),
                                items: List.generate(10, (i) => i + 1)
                                    .map((v) => DropdownMenuItem(value: v, child: Text("$v Beds")))
                                    .toList(),
                                onChanged: (val) {
                                  if (val != null) setState(() => _bedrooms = val);
                                },
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel("Bathrooms"),
                              DropdownButtonFormField<double>(
                                dropdownColor: const Color(0xFF0e0a22),
                                value: _bathrooms,
                                style: const TextStyle(color: Colors.white),
                                decoration: _inputDecoration(),
                                items: [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0]
                                    .map((v) => DropdownMenuItem(value: v, child: Text("$v Baths")))
                                    .toList(),
                                onChanged: (val) {
                                  if (val != null) setState(() => _bathrooms = val);
                                },
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Condition Dropdown
                    _buildLabel("Structural Condition"),
                    DropdownButtonFormField<String>(
                      dropdownColor: const Color(0xFF0e0a22),
                      value: _condition,
                      style: const TextStyle(color: Colors.white),
                      decoration: _inputDecoration(),
                      items: ["Excellent", "Good", "Fair", "Needs Work"]
                          .map((cond) => DropdownMenuItem(value: cond, child: Text(cond)))
                          .toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _condition = val);
                      },
                    ),
                    const SizedBox(height: 14),

                    // Listing price check
                    _buildLabel("Target Purchase / Asking Price (\$)"),
                    TextField(
                      controller: _priceController,
                      style: const TextStyle(color: Colors.white),
                      keyboardType: TextInputType.number,
                      decoration: _inputDecoration().copyWith(hintText: "e.g., 450000"),
                    ),
                    const SizedBox(height: 14),

                    // Amenities checklist
                    _buildLabel("Select Amenities"),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: ["Pool", "Gym", "Garden", "Smart_Home", "Garage"].map((name) {
                        final isSelected = _selectedAmenities.contains(name);
                        return GestureDetector(
                          onTap: () => _toggleAmenity(name),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: isSelected ? const Color(0xFF8B5CF6).withOpacity(0.15) : const Color(0xFF080511),
                              border: Border.all(color: isSelected ? const Color(0xFF8B5CF6) : Colors.white10),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              name.replaceAll('_', ' '),
                              style: TextStyle(color: isSelected ? Colors.white : Colors.grey, fontSize: 11, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 20),

                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF8B5CF6),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        onPressed: _isCalculating ? null : _triggerCalculation,
                        child: _isCalculating
                            ? const CircularProgressIndicator(color: Colors.white)
                            : const Text("Run AI Appraisal Models", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Output Section
              if (_result != null) _buildResultSection()
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildResultSection() {
    final val = _result!['valuation'];
    final rec = _result!['recommendation'];
    final anomalies = _result!['anomalies'];

    final int fairValue = (val['estimatedValue'] as num?)?.toInt() ?? 0;
    final int confidence = (val['confidenceScore'] as num?)?.toInt() ?? 0;
    final rating = rec['rating'] ?? 'Neutral';
    final action = rec['action'] ?? 'HOLD';
    final explanation = rec['explanation'] ?? '';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "AI Appraisal Analysis",
          style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold, fontFamily: 'Outfit'),
        ),
        const SizedBox(height: 12),

        // Fair market value box
        Row(
          children: [
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF0e0a22),
                  border: Border.all(color: const Color(0xFF7000FF).withOpacity(0.15)),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text("APPRAISED FAIR VALUE", style: TextStyle(color: Colors.grey, fontSize: 9)),
                    const SizedBox(height: 6),
                    Text(
                      "\$${fairValue.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}",
                      style: const TextStyle(color: Color(0xFF06B6D4), fontSize: 18, fontWeight: FontWeight.w800, fontFamily: 'Outfit'),
                    ),
                    Text("\$${val['pricePerSqft']}/sqft average", style: const TextStyle(color: Colors.grey, fontSize: 10)),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF0e0a22),
                  border: Border.all(color: const Color(0xFF7000FF).withOpacity(0.15)),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text("CONFIDENCE SCORE", style: TextStyle(color: Colors.grey, fontSize: 9)),
                    const SizedBox(height: 6),
                    Text(
                      "$confidence%",
                      style: const TextStyle(color: Color(0xFF10B981), fontSize: 18, fontWeight: FontWeight.w800, fontFamily: 'Outfit'),
                    ),
                    const Text("Based on location data", style: TextStyle(color: Colors.grey, fontSize: 10)),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Recommendation Gauge visualizer
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF0e0a22),
            border: Border.all(color: const Color(0xFF7000FF).withOpacity(0.15)),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              const Text("DECISION ADVICE GAUGE", style: TextStyle(color: Colors.grey, fontSize: 9, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              SizedBox(
                height: 70,
                width: 150,
                child: CustomPaint(
                  painter: NeedleGaugePainter(rating),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                rating,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16, fontFamily: 'Outfit'),
              ),
              const SizedBox(height: 6),
              Text(
                explanation,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 11, height: 1.4),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // 5-year appreciation table
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF0e0a22),
            border: Border.all(color: const Color(0xFF7000FF).withOpacity(0.15)),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Appreciation Forecast (+${val['growthRatePercent']}% YoY)",
                style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold, fontFamily: 'Outfit'),
              ),
              const SizedBox(height: 10),
              Table(
                border: const TableBorder(horizontalInside: BorderSide(color: Colors.white10, width: 0.5)),
                children: [
                  const TableRow(
                    children: [
                      Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Text("Year", style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold))),
                      Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Text("Projected Value", style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold))),
                      Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Text("Net Gain", style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold))),
                    ],
                  ),
                  ...(val['projectedAppreciation'] as List).map((proj) {
                    final int value = (proj['value'] as num?)?.toInt() ?? 0;
                    final int gain = value - fairValue;
                    return TableRow(
                      children: [
                        Padding(padding: const EdgeInsets.symmetric(vertical: 8), child: Text(proj['year'].toString(), style: const TextStyle(color: Colors.grey, fontSize: 12))),
                        Padding(padding: const EdgeInsets.symmetric(vertical: 8), child: Text("\$${value.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}", style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold))),
                        Padding(padding: const EdgeInsets.symmetric(vertical: 8), child: Text("+\$${gain.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}", style: const TextStyle(color: Color(0xFF10B981), fontSize: 12, fontWeight: FontWeight.bold))),
                      ],
                    );
                  }).toList(),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Anomalies scan warnings
        if (anomalies['isSuspicious'] ?? false)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
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
                    Icon(Icons.warning_amber_rounded, color: Color(0xFFEF4444), size: 18),
                    SizedBox(width: 6),
                    Text("AI FRAUD SCANS FLAG WARNING", style: TextStyle(color: Color(0xFFEF4444), fontWeight: FontWeight.bold, fontSize: 11)),
                  ],
                ),
                const SizedBox(height: 8),
                ...(anomalies['flags'] as List).map((flag) => Padding(
                  padding: const EdgeInsets.only(bottom: 4.0),
                  child: Text("• $flag", style: const TextStyle(color: Color(0xFFFCA5A5), fontSize: 11)),
                )),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6.0),
      child: Text(
        text.toUpperCase(),
        style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5),
      ),
    );
  }

  InputDecoration _inputDecoration() {
    return InputDecoration(
      filled: true,
      fillColor: const Color(0xFF080511),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Colors.white12),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color(0xFF8B5CF6)),
      ),
    );
  }
}

// Custom painter to draw the half-circle investment needle gauge
class NeedleGaugePainter extends CustomPainter {
  final String rating;
  NeedleGaugePainter(this.rating);

  @override
  void paint(Canvas canvas, Size size) {
    final double radius = size.height;
    final Offset center = Offset(size.width / 2, size.height);

    // Draw full back arc path
    final paintArc = Paint()
      ..strokeWidth = 10
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final rect = Rect.fromCircle(center: center, radius: radius - 5);
    
    // Draw background gray
    paintArc.color = Colors.white.withOpacity(0.08);
    canvas.drawArc(rect, 3.14, 3.14, false, paintArc);

    // Draw colored sections
    final colors = [
      const Color(0xFFEF4444), // Red (Strong Sell)
      const Color(0xFFF59E0B), // Orange (Hold)
      const Color(0xFF10B981), // Green (Buy)
      const Color(0xFF06B6D4)  // Cyan (Strong Buy)
    ];

    final double sectionAngle = 3.14 / colors.length;
    for (int i = 0; i < colors.length; i++) {
      paintArc.color = colors[i].withOpacity(0.85);
      canvas.drawArc(rect, 3.14 + (i * sectionAngle), sectionAngle, false, paintArc);
    }

    // Needle Angle based on ratings
    double needleAngle = 3.14 / 2; // Default Hold is straight up (90 deg)
    switch (rating) {
      case 'Strong Buy':
        needleAngle = 3.14 + (sectionAngle * 3.5);
        break;
      case 'Buy':
        needleAngle = 3.14 + (sectionAngle * 2.8);
        break;
      case 'Hold / Fair Value':
        needleAngle = 3.14 + (sectionAngle * 2.0);
        break;
      case 'Neutral / Overpriced':
        needleAngle = 3.14 + (sectionAngle * 1.2);
        break;
      case 'Strong Sell':
        needleAngle = 3.14 + (sectionAngle * 0.5);
        break;
    }

    // Draw Needle line
    final paintNeedle = Paint()
      ..color = Colors.white
      ..strokeWidth = 3.5
      ..strokeCap = StrokeCap.round;

    final double needleLen = radius - 15;
    final double dx = needleLen * math.cos(needleAngle);
    final double dy = needleLen * math.sin(needleAngle);
    canvas.drawLine(center, center + Offset(dx, dy), paintNeedle);

    // Draw center hub circle
    final paintHub = Paint()..color = Colors.white;
    canvas.drawCircle(center, 6, paintHub);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
