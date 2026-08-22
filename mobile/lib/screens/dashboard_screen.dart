import 'package:flutter/material.dart';
import '../models/property.dart';
import '../services/api_service.dart';
import 'property_list_screen.dart';

class DashboardScreen extends StatefulWidget {
  final VoidCallback onNavigateToCalculator;
  const DashboardScreen({super.key, required this.onNavigateToCalculator});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final ApiService _apiService = ApiService();
  List<Property> _properties = [];
  List<BlockchainBlock> _ledger = [];
  Map<String, List<MarketTrendPoint>> _trends = {};
  bool _isLoading = true;
  String _errorMessage = "";
  
  // Selected location for the trend chart
  String _selectedLocation = "Downtown";

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = "";
    });
    try {
      final props = await _apiService.getProperties();
      final blocks = await _apiService.getBlockchainLedger();
      final trends = await _apiService.getMarketTrends();
      setState(() {
        _properties = props;
        _ledger = blocks;
        _trends = trends;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = "Backend connection failed. Adjust the Host IP address in settings.";
        _isLoading = false;
      });
    }
  }

  void _showSettingsDialog() {
    final textController = TextEditingController(text: ApiService.hostAddress);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF0e0a22),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xFF7000FF), width: 1.5),
        ),
        title: const Text(
          "Network Configuration",
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontFamily: 'Outfit'),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "Set Node.js Backend Server Host IP:",
              style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 13),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: textController,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                filled: true,
                fillColor: const Color(0xFF080511),
                hintText: "e.g., localhost or 10.0.2.2",
                hintStyle: const TextStyle(color: Colors.grey),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: Colors.white12),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: Color(0xFF8B5CF6)),
                ),
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              "• Use '10.0.2.2' for Android Emulators\n• Use 'localhost' for iOS Simulators or Web\n• Use your Wi-Fi IPv4 address for physical devices",
              style: TextStyle(color: Colors.grey, fontSize: 11, height: 1.4),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Cancel", style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF8B5CF6),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () {
              ApiService.setHost(textController.text.trim());
              Navigator.pop(context);
              _fetchData();
            },
            child: const Text("Apply & Sync", style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Math stats
    final verifiedCount = _properties.where((p) => p.blockchainTxHash.isNotEmpty).length;
    final anomalyCount = _properties.where((p) => p.anomalies.isSuspicious).length;

    return Scaffold(
      backgroundColor: const Color(0xFF080511),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0e0a22),
        elevation: 0,
        title: Row(
          children: [
            ShaderMask(
              shaderCallback: (bounds) => const LinearGradient(
                colors: [Color(0xFF8B5CF6), Color(0xFF06B6D4)],
              ).createShader(bounds),
              child: const Text(
                "PropAI",
                style: TextStyle(
                  color: Colors.white,
                  fontFamily: 'Outfit',
                  fontWeight: FontWeight.w800,
                  fontSize: 22,
                ),
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings, color: Colors.white70),
            onPressed: _showSettingsDialog,
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white70),
            onPressed: _fetchData,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchData,
        color: const Color(0xFF8B5CF6),
        backgroundColor: const Color(0xFF0e0a22),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (_errorMessage.isNotEmpty)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    margin: const EdgeInsets.bottom(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEF4444).withOpacity(0.1),
                      border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.4)),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.between,
                      children: [
                        Expanded(
                          child: Text(
                            _errorMessage,
                            style: const TextStyle(color: Color(0xFFFCA5A5), fontSize: 13),
                          ),
                        ),
                        TextButton(
                          onPressed: _showSettingsDialog,
                          child: const Text(
                            "Configure",
                            style: TextStyle(color: Color(0xFF06B6D4), fontWeight: FontWeight.bold),
                          ),
                        )
                      ],
                    ),
                  ),

                // Statistics Row
                GridView.count(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: 3,
                  crossAxisSpacing: 10,
                  childAspectRatio: 1.1,
                  children: [
                    _buildStatCard("Properties", _properties.length.toString(), "Active DB", const Color(0xFF8B5CF6)),
                    _buildStatCard("Blockchain", verifiedCount.toString(), "Verified Deeds", const Color(0xFF10B981)),
                    _buildStatCard(
                      "Fraud Alerts", 
                      anomalyCount.toString(), 
                      anomalyCount > 0 ? "Risks Flagged" : "Clear", 
                      anomalyCount > 0 ? const Color(0xFFEF4444) : const Color(0xFF10B981)
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Market trend line graph card
                _buildMarketTrendCard(),
                const SizedBox(height: 24),

                // Featured Real Estate Listings Horizontal List
                Row(
                  mainAxisAlignment: MainAxisAlignment.between,
                  children: [
                    const Text(
                      "Featured Vetted Properties",
                      style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold, fontFamily: 'Outfit'),
                    ),
                    TextButton(
                      onPressed: () {
                        // Normally this would navigate tabs, parent handles it
                      },
                      child: const Text("View All", style: TextStyle(color: Color(0xFF06B6D4))),
                    )
                  ],
                ),
                const SizedBox(height: 8),

                _isLoading
                    ? const Center(child: Padding(padding: EdgeInsets.all(24.0), child: CircularProgressIndicator(color: Color(0xFF8B5CF6))))
                    : _properties.isEmpty
                        ? const Center(child: Padding(padding: EdgeInsets.all(32.0), child: Text("No properties found. Tap + above to add one.", style: TextStyle(color: Colors.grey))))
                        : SizedBox(
                            height: 280,
                            child: ListView.builder(
                              scrollDirection: Axis.horizontal,
                              itemCount: _properties.length > 5 ? 5 : _properties.length,
                              itemBuilder: (context, index) {
                                final p = _properties[index];
                                return _buildPropertyFeaturedCard(p);
                              },
                            ),
                          ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(String title, String count, String label, Color accentColor) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF0e0a22).withOpacity(0.65),
        border: Border.all(color: const Color(0xFF7000FF).withOpacity(0.15)),
        borderRadius: BorderRadius.circular(14),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 10, fontWeight: FontWeight.w600, letterSpacing: 0.5),
          ),
          const SizedBox(height: 4),
          Text(
            count,
            style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800, fontFamily: 'Outfit'),
          ),
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
            decoration: BoxDecoration(
              color: accentColor.withOpacity(0.15),
              border: Border.all(color: accentColor.withOpacity(0.4), width: 0.5),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(color: accentColor, fontSize: 8, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMarketTrendCard() {
    final points = _trends[_selectedLocation] ?? [];

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: const Color(0xFF0e0a22).withOpacity(0.65),
        border: Border.all(color: const Color(0xFF7000FF).withOpacity(0.15)),
        borderRadius: BorderRadius.circular(16),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    "District Market Performance",
                    style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold, fontFamily: 'Outfit'),
                  ),
                  Text(
                    "Price per sqft trends over time",
                    style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 11),
                  ),
                ],
              ),
              DropdownButton<String>(
                dropdownColor: const Color(0xFF0e0a22),
                value: _selectedLocation,
                style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                underline: const SizedBox(),
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
            ],
          ),
          const SizedBox(height: 16),
          if (points.isNotEmpty)
            SizedBox(
              height: 140,
              width: double.infinity,
              child: CustomPaint(
                painter: LineChartPainter(points),
              ),
            )
          else
            const SizedBox(
              height: 140,
              child: Center(
                child: CircularProgressIndicator(color: Color(0xFF06B6D4)),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildPropertyFeaturedCard(Property p) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => PropertyDetailView(property: p)),
        );
      },
      child: Container(
        width: 220,
        margin: const EdgeInsets.only(right: 14),
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
                  height: 110,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (context, _, __) => Container(height: 110, color: Colors.grey[900], child: const Icon(Icons.home, color: Colors.white)),
                ),
                Positioned(
                  top: 8,
                  left: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                    decoration: BoxDecoration(
                      color: p.blockchainTxHash.isNotEmpty ? const Color(0xFF10B981).withOpacity(0.85) : const Color(0xFFEF4444).withOpacity(0.85),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      p.blockchainTxHash.isNotEmpty ? "✓ Verified" : "Unverified",
                      style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    p.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold, fontFamily: 'Outfit'),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    "\$${p.listingPrice.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}",
                    style: const TextStyle(color: Color(0xFF06B6D4), fontSize: 16, fontWeight: FontWeight.w800, fontFamily: 'Outfit'),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    p.location,
                    style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 11),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        "${p.sqft} sqft",
                        style: const TextStyle(color: Colors.grey, fontSize: 10),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFF8B5CF6).withOpacity(0.15),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: const Color(0xFF8B5CF6).withOpacity(0.4), width: 0.5),
                        ),
                        child: Text(
                          p.recommendation.action,
                          style: const TextStyle(color: Color(0xFF8B5CF6), fontSize: 9, fontWeight: FontWeight.bold),
                        ),
                      )
                    ],
                  )
                ],
              ),
            )
          ],
        ),
      ),
    );
  }
}

// Custom painter to draw the glowing market trend chart line
class LineChartPainter extends CustomPainter {
  final List<MarketTrendPoint> points;
  LineChartPainter(this.points);

  @override
  void paint(Canvas canvas, Size size) {
    if (points.isEmpty) return;

    final paintLine = Paint()
      ..color = const Color(0xFF06B6D4)
      ..strokeWidth = 3.0
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final paintShadow = Paint()
      ..color = const Color(0xFF06B6D4).withOpacity(0.2)
      ..strokeWidth = 8.0
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    // Grid details
    final double paddingX = 40;
    final double paddingY = 15;
    final double chartWidth = size.width - paddingX - 10;
    final double chartHeight = size.height - paddingY - 15;

    final prices = points.map((p) => p.pricePerSqft).toList();
    final double minVal = prices.reduce((a, b) => a < b ? a : b) * 0.95;
    final double maxVal = prices.reduce((a, b) => a > b ? a : b) * 1.05;

    final int len = points.length;

    double getX(int i) => paddingX + (i / (len - 1)) * chartWidth;
    double getY(int price) => chartHeight + paddingY - ((price - minVal) / (maxVal - minVal)) * chartHeight;

    // Draw grid horizontal line guides
    final textPainter = TextPainter(textDirection: TextDirection.ltr);
    for (int idx = 0; idx <= 4; idx++) {
      final double ratio = idx / 4;
      final double currentPrice = minVal + ratio * (maxVal - minVal);
      final double yPos = getY(currentPrice.toInt());

      // Dash lines
      final dashPaint = Paint()
        ..color = Colors.white.withOpacity(0.05)
        ..strokeWidth = 1;
      
      canvas.drawLine(Offset(paddingX, yPos), Offset(size.width - 10, yPos), dashPaint);

      // Y-axis text
      textPainter.text = TextSpan(
        text: "\$${currentPrice.toInt()}",
        style: TextStyle(color: Colors.grey[700], fontSize: 9),
      );
      textPainter.layout();
      textPainter.paint(canvas, Offset(paddingX - textPainter.width - 5, yPos - 5));
    }

    final path = Path();
    path.moveTo(getX(0), getY(points[0].pricePerSqft));

    for (int i = 1; i < len; i++) {
      path.lineTo(getX(i), getY(points[i].pricePerSqft));
    }

    // Draw shadow first for bloom effect, then line
    canvas.drawPath(path, paintShadow);
    canvas.drawPath(path, paintLine);

    // Draw Gradient Area fill under line
    final fillPath = Path()
      ..moveTo(getX(0), getY(points[0].pricePerSqft));
    for (int i = 1; i < len; i++) {
      fillPath.lineTo(getX(i), getY(points[i].pricePerSqft));
    }
    fillPath.lineTo(getX(len - 1), chartHeight + paddingY);
    fillPath.lineTo(getX(0), chartHeight + paddingY);
    fillPath.close();

    final fillPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [const Color(0xFF06B6D4).withOpacity(0.35), const Color(0xFF06B6D4).withOpacity(0.0)],
      ).createShader(Rect.fromLTWH(paddingX, paddingY, chartWidth, chartHeight))
      ..style = PaintingStyle.fill;
    canvas.drawPath(fillPath, fillPaint);

    // Draw little circles at nodes and Year names on X-axis
    final pointPaint = Paint()
      ..color = const Color(0xFF080511)
      ..style = PaintingStyle.fill;
    final strokePaint = Paint()
      ..color = const Color(0xFF06B6D4)
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke;

    for (int i = 0; i < len; i++) {
      final double x = getX(i);
      final double y = getY(points[i].pricePerSqft);
      canvas.drawCircle(Offset(x, y), 4.5, pointPaint);
      canvas.drawCircle(Offset(x, y), 4.5, strokePaint);

      textPainter.text = TextSpan(
        text: points[i].year.toString(),
        style: const TextStyle(color: Colors.grey, fontSize: 9),
      );
      textPainter.layout();
      textPainter.paint(canvas, Offset(x - textPainter.width / 2, chartHeight + paddingY + 5));
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
