import 'package:flutter/material.dart';
import '../models/property.dart';
import '../services/api_service.dart';
import 'property_list_screen.dart';

class LedgerScreen extends StatefulWidget {
  const LedgerScreen({super.key});

  @override
  State<LedgerScreen> createState() => _LedgerScreenState();
}

class _LedgerScreenState extends State<LedgerScreen> {
  final ApiService _apiService = ApiService();
  List<BlockchainBlock> _ledger = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchLedger();
  }

  Future<void> _fetchLedger() async {
    setState(() {
      _isLoading = true;
    });
    try {
      final data = await _apiService.getBlockchainLedger();
      setState(() {
        _ledger = data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF080511),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0e0a22),
        elevation: 0,
        title: const Text(
          "Blockchain Title Ledger",
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontFamily: 'Outfit'),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white70),
            onPressed: _fetchLedger,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF8B5CF6)))
          : _ledger.isEmpty
              ? const Center(child: Text("Ledger empty or unreachable.", style: TextStyle(color: Colors.grey)))
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                  itemCount: _ledger.length,
                  itemBuilder: (context, index) {
                    final block = _ledger[index];
                    return _buildBlockTimelineItem(block, index == 0, index == _ledger.length - 1);
                  },
                ),
    );
  }

  Widget _buildBlockTimelineItem(BlockchainBlock block, bool isGenesis, bool isLast) {
    final Map<String, dynamic> data = block.data;
    final String propertyName = data['propertyName'] ?? (isGenesis ? 'Genesis Block Initiator' : 'Property Deed');
    final String ownerName = data['ownerName'] ?? (isGenesis ? 'System Core' : 'N/A');
    final int price = data['purchasePrice'] ?? 0;

    final dotColor = isGenesis ? const Color(0xFFEC4899) : const Color(0xFF06B6D4);

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Timeline indicator line
          Column(
            children: [
              Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: dotColor,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(color: dotColor.withOpacity(0.5), blurRadius: 8, spreadRadius: 1),
                  ],
                ),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    color: const Color(0xFF7000FF).withOpacity(0.3),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 16),

          // Block content card
          Expanded(
            child: GestureDetector(
              onTap: () {
                // Show raw metadata popup
                showDialog(
                  context: context,
                  builder: (context) => AlertDialog(
                    backgroundColor: const Color(0xFF0e0a22),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                      side: const BorderSide(color: Color(0xFF7000FF), width: 1),
                    ),
                    title: Text(
                      "Block #${block.index} Raw Metadata",
                      style: const TextStyle(color: Colors.white, fontFamily: 'Outfit', fontWeight: FontWeight.bold),
                    ),
                    content: SingleChildScrollView(
                      child: Text(
                        "Index: ${block.index}\n"
                        "Timestamp: ${block.timestamp}\n"
                        "Nonce: ${block.nonce}\n"
                        "Previous Hash: ${block.previousHash}\n"
                        "Hash: ${block.hash}\n"
                        "Payload Data: ${block.data}",
                        style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 12, fontFamily: 'monospace'),
                      ),
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(context),
                        child: const Text("Close", style: TextStyle(color: Color(0xFF06B6D4))),
                      ),
                    ],
                  ),
                );
              },
              child: Container(
                margin: const EdgeInsets.only(bottom: 20),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF0e0a22).withOpacity(0.65),
                  border: Border.all(color: const Color(0xFF7000FF).withOpacity(0.15)),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.between,
                      children: [
                        Text(
                          "Block #${block.index}",
                          style: TextStyle(
                            color: isGenesis ? const Color(0xFFEC4899) : Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            fontFamily: 'Outfit',
                          ),
                        ),
                        Text(
                          block.timestamp.length > 19 ? block.timestamp.substring(11, 19) : block.timestamp,
                          style: const TextStyle(color: Colors.grey, fontSize: 10),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      propertyName,
                      style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    if (!isGenesis) ...[
                      Text(
                        "Registrant: $ownerName",
                        style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 11),
                      ),
                      if (price > 0)
                        Text(
                          "Value: \$${price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}",
                          style: const TextStyle(color: Color(0xFF06B6D4), fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                    ],
                    const SizedBox(height: 12),

                    // Hash block details
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFF080511),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildHashLabel("HASH", block.hash),
                          const SizedBox(height: 4),
                          _buildHashLabel("PREV", block.previousHash),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHashLabel(String label, String hash) {
    final dispHash = hash.length > 20 
        ? "${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}"
        : hash;
    return Row(
      mainAxisAlignment: MainAxisAlignment.between,
      children: [
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 8, fontWeight: FontWeight.bold)),
        Text(
          dispHash,
          style: const TextStyle(color: Color(0xFF06B6D4), fontFamily: 'monospace', fontSize: 9),
        ),
      ],
    );
  }
}
