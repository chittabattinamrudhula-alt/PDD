import 'package:flutter/material.dart';
import '../models/property.dart';
import '../services/api_service.dart';

class BookingsScreen extends StatefulWidget {
  final User currentUser;
  const BookingsScreen({super.key, required this.currentUser});

  @override
  State<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends State<BookingsScreen> {
  final ApiService _apiService = ApiService();
  List<Booking> _bookings = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchBookings();
  }

  Future<void> _fetchBookings() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final buyerIdParam = widget.currentUser.role == 'Buyer' ? widget.currentUser.id : null;
      final data = await _apiService.getBookings(buyerId: buyerIdParam);
      setState(() {
        _bookings = data;
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
    String pageTitle = "Global Reservation Logs";
    if (widget.currentUser.role == 'Buyer') {
      pageTitle = "My Property Bookings";
    } else if (widget.currentUser.role == 'Seller') {
      pageTitle = "Sales Ledger Reservations";
    }

    return Scaffold(
      backgroundColor: const Color(0xFF080511),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0e0a22),
        elevation: 0,
        title: Text(
          pageTitle,
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontFamily: 'Outfit'),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white70),
            onPressed: _fetchBookings,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF8B5CF6)))
          : _bookings.isEmpty
              ? _buildEmptyState()
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _bookings.length,
                  itemBuilder: (context, index) {
                    final booking = _bookings[index];
                    return _buildBookingCard(booking);
                  },
                ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.bookmark_outline, size: 60, color: Colors.grey[800]),
            const SizedBox(height: 16),
            const Text(
              "Escrow Register Empty",
              style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold, fontFamily: 'Outfit'),
            ),
            const SizedBox(height: 8),
            Text(
              widget.currentUser.role == 'Buyer'
                  ? "Go to the Registry tab and book a property."
                  : "Properties listed will appear here once booked.",
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.grey, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBookingCard(Booking b) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0e0a22).withOpacity(0.65),
        border: Border.all(color: const Color(0xFF7000FF).withOpacity(0.15)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      b.propertyTitle,
                      style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      b.propertyLocation,
                      style: const TextStyle(color: Colors.grey, fontSize: 11),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Text(
                "\$${b.price.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')}",
                style: const TextStyle(color: Color(0xFF06B6D4), fontSize: 15, fontWeight: FontWeight.w800, fontFamily: 'Outfit'),
              ),
            ],
          ),
          const Divider(color: Colors.white10, height: 24),
          
          // Buyer details info row
          Row(
            mainAxisAlignment: MainAxisAlignment.between,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("RESERVED BY", style: TextStyle(color: Colors.grey, fontSize: 8, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(b.buyerName, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text("RESERVATION DATE", style: TextStyle(color: Colors.grey, fontSize: 8, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(
                    b.bookingDate.length > 10 ? b.bookingDate.substring(0, 10) : b.bookingDate,
                    style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                ],
              )
            ],
          ),
          const SizedBox(height: 12),

          // Blockchain transaction receipt
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFF080511),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.between,
              children: [
                const Text("LEDGER RECEIPT", style: TextStyle(color: Colors.grey, fontSize: 8, fontWeight: FontWeight.bold)),
                Text(
                  b.blockchainTxHash.length > 20
                      ? "${b.blockchainTxHash.substring(0, 10)}...${b.blockchainTxHash.substring(b.blockchainTxHash.length - 8)}"
                      : b.blockchainTxHash,
                  style: const TextStyle(color: Color(0xFF06B6D4), fontFamily: 'monospace', fontSize: 9),
                ),
              ],
            ),
          )
        ],
      ),
    );
  }
}
