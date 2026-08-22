import 'package:flutter/material.dart';
import 'screens/landing_screen.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/property_list_screen.dart';
import 'screens/valuation_screen.dart';
import 'screens/ledger_screen.dart';
import 'screens/bookings_screen.dart';
import 'services/api_service.dart';
import 'models/property.dart';

void main() {
  runApp(const PropAIApp());
}

class PropAIApp extends StatelessWidget {
  const PropAIApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PropAI',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF080511),
        primaryColor: const Color(0xFF8B5CF6),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF8B5CF6),
          secondary: Color(0xFF06B6D4),
          surface: Color(0xFF0e0a22),
        ),
        textTheme: ThemeData.dark().textTheme.apply(
          fontFamily: 'Inter',
        ),
      ),
      home: const AuthNavigationWrapper(),
    );
  }
}

class AuthNavigationWrapper extends StatefulWidget {
  const AuthNavigationWrapper({super.key});

  @override
  State<AuthNavigationWrapper> createState() => _AuthNavigationWrapperState();
}

class _AuthNavigationWrapperState extends State<AuthNavigationWrapper> {
  User? _currentUser;
  String _authState = "landing"; // 'landing' | 'login' | 'signup' | 'app'

  @override
  Widget build(BuildContext context) {
    if (_currentUser == null) {
      if (_authState == "login") {
        return LoginScreen(
          initialIsSignup: false,
          onAuthSuccess: (user) {
            setState(() {
              _currentUser = user;
              _authState = "app";
            });
          },
          onCancel: () {
            setState(() {
              _authState = "landing";
            });
          },
        );
      } else if (_authState == "signup") {
        return LoginScreen(
          initialIsSignup: true,
          onAuthSuccess: (user) {
            setState(() {
              _currentUser = user;
              _authState = "app";
            });
          },
          onCancel: () {
            setState(() {
              _authState = "landing";
            });
          },
        );
      } else {
        return LandingScreen(
          onLoginPressed: () {
            setState(() {
              _authState = "login";
            });
          },
          onSignupPressed: () {
            setState(() {
              _authState = "signup";
            });
          },
        );
      }
    } else {
      return MainNavigationContainer(
        currentUser: _currentUser!,
        onLogout: () {
          setState(() {
            _currentUser = null;
            _authState = "landing";
          });
        },
      );
    }
  }
}

class MainNavigationContainer extends StatefulWidget {
  final User currentUser;
  final VoidCallback onLogout;

  const MainNavigationContainer({
    super.key,
    required this.currentUser,
    required this.onLogout,
  });

  @override
  State<MainNavigationContainer> createState() => _MainNavigationContainerState();
}

class _MainNavigationContainerState extends State<MainNavigationContainer> {
  int _selectedIndex = 0;
  final ApiService _apiService = ApiService();

  late List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _initScreens();
  }

  void _initScreens() {
    _screens = [
      DashboardScreen(
        onNavigateToCalculator: () {
          setState(() {
            _selectedIndex = 2; // Nav to Valuation tab
          });
        },
      ),
      PropertyListScreen(currentUser: widget.currentUser),
      const ValuationScreen(),
      const LedgerScreen(),
      BookingsScreen(currentUser: widget.currentUser),
    ];
  }

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  // Add listing modal sheet
  void _showAddPropertySheet() {
    final formKey = GlobalKey<FormState>();
    String title = "";
    String description = "";
    String location = "Suburbs";
    int sqft = 1500;
    int bedrooms = 3;
    double bathrooms = 2.0;
    int age = 5;
    String condition = "Good";
    int price = 320000;
    bool titleVerified = true;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF0e0a22),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
      ),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            top: 20,
            left: 16,
            right: 16,
          ),
          child: Form(
            key: formKey,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      const Text(
                        "Publish Property Listing",
                        style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold, fontFamily: 'Outfit'),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: Colors.grey),
                        onPressed: () => Navigator.pop(context),
                      )
                    ],
                  ),
                  const SizedBox(height: 12),
                  
                  TextFormField(
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    decoration: _inputDecoration("Property Title"),
                    validator: (v) => v == null || v.isEmpty ? "Required" : null,
                    onSaved: (v) => title = v ?? "",
                  ),
                  const SizedBox(height: 10),

                  TextFormField(
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    maxLines: 2,
                    decoration: _inputDecoration("Description"),
                    onSaved: (v) => description = v ?? "",
                  ),
                  const SizedBox(height: 10),

                  TextFormField(
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                    keyboardType: TextInputType.number,
                    decoration: _inputDecoration("Asking Price (\$)"),
                    validator: (v) => v == null || v.isEmpty ? "Required" : null,
                    onSaved: (v) => price = int.tryParse(v ?? "") ?? 320000,
                  ),
                  const SizedBox(height: 10),

                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          dropdownColor: const Color(0xFF0e0a22),
                          value: location,
                          style: const TextStyle(color: Colors.white),
                          decoration: _inputDecoration("District"),
                          items: ["Downtown", "Beachfront", "Uptown", "Suburbs", "Rural"]
                              .map((loc) => DropdownMenuItem(value: loc, child: Text(loc)))
                              .toList(),
                          onChanged: (val) => setModalState(() => location = val ?? "Suburbs"),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          dropdownColor: const Color(0xFF0e0a22),
                          value: condition,
                          style: const TextStyle(color: Colors.white),
                          decoration: _inputDecoration("Condition"),
                          items: ["Excellent", "Good", "Fair", "Needs Work"]
                              .map((cond) => DropdownMenuItem(value: cond, child: Text(cond)))
                              .toList(),
                          onChanged: (val) => setModalState(() => condition = val ?? "Good"),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          style: const TextStyle(color: Colors.white, fontSize: 13),
                          keyboardType: TextInputType.number,
                          decoration: _inputDecoration("Area (SqFt)"),
                          validator: (v) => v == null || v.isEmpty ? "Required" : null,
                          onSaved: (v) => sqft = int.tryParse(v ?? "") ?? 1500,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextFormField(
                          style: const TextStyle(color: Colors.white, fontSize: 13),
                          keyboardType: TextInputType.number,
                          decoration: _inputDecoration("Age (Years)"),
                          validator: (v) => v == null || v.isEmpty ? "Required" : null,
                          onSaved: (v) => age = int.tryParse(v ?? "") ?? 5,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),

                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<int>(
                          dropdownColor: const Color(0xFF0e0a22),
                          value: bedrooms,
                          style: const TextStyle(color: Colors.white),
                          decoration: _inputDecoration("Beds"),
                          items: List.generate(8, (i) => i + 1)
                              .map((v) => DropdownMenuItem(value: v, child: Text("$v Beds")))
                              .toList(),
                          onChanged: (val) => setModalState(() => bedrooms = val ?? 3),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: DropdownButtonFormField<double>(
                          dropdownColor: const Color(0xFF0e0a22),
                          value: bathrooms,
                          style: const TextStyle(color: Colors.white),
                          decoration: _inputDecoration("Baths"),
                          items: [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0]
                              .map((v) => DropdownMenuItem(value: v, child: Text("$v Baths")))
                              .toList(),
                          onChanged: (val) => setModalState(() => bathrooms = val ?? 2.0),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  CheckboxListTile(
                    title: const Text("Verify title deed on Blockchain registry", style: TextStyle(color: Colors.white70, fontSize: 12)),
                    value: titleVerified,
                    activeColor: const Color(0xFF8B5CF6),
                    contentPadding: EdgeInsets.zero,
                    controlAffinity: ListTileControlAffinity.leading,
                    onChanged: (val) {
                      setModalState(() {
                        titleVerified = val ?? true;
                      });
                    },
                  ),
                  const SizedBox(height: 14),

                  SizedBox(
                    width: double.infinity,
                    height: 46,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF8B5CF6),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () async {
                        if (formKey.currentState!.validate()) {
                          formKey.currentState!.save();
                          
                          final payload = {
                            "title": title,
                            "description": description.isNotEmpty ? description : "New property listed from mobile device.",
                            "location": location,
                            "sqft": sqft,
                            "bedrooms": bedrooms,
                            "bathrooms": bathrooms,
                            "age": age,
                            "condition": condition,
                            "amenities": <String>[],
                            "listingPrice": price,
                            "ownerName": widget.currentUser.name,
                            "titleVerified": titleVerified,
                          };

                          try {
                            await _apiService.createPropertyListing(payload);
                            Navigator.pop(context);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text("Block Mined! Listing registered successfully.")),
                            );
                            _initScreens(); // Re-initialize lists to load new property
                            setState(() {});
                          } catch (e) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text("Failed to publish property registration: $e")),
                            );
                          }
                        }
                      },
                      child: const Text("Publish Listing", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String label) {
    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(color: Colors.grey, fontSize: 11),
      filled: true,
      fillColor: const Color(0xFF080511),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Colors.white10),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: Color(0xFF8B5CF6)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final role = widget.currentUser.role;
    Color roleColor = const Color(0xFF06B6D4);
    if (role == 'Seller') roleColor = const Color(0xFF8B5CF6);
    if (role == 'Admin') roleColor = const Color(0xFFEC4899);

    return Scaffold(
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
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            margin: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: roleColor.withOpacity(0.12),
              border: Border.all(color: roleColor.withOpacity(0.4), width: 0.8),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              role.toUpperCase(),
              style: TextStyle(color: roleColor, fontSize: 9, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(width: 8),
          Center(
            child: Text(
              widget.currentUser.name,
              style: const TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.bold),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white70, size: 20),
            onPressed: widget.onLogout,
          ),
        ],
      ),
      body: IndexedStack(
        index: _selectedIndex,
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        backgroundColor: const Color(0xFF0e0a22),
        selectedItemColor: const Color(0xFF06B6D4),
        unselectedItemColor: Colors.white38,
        selectedLabelStyle: const TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.bold, fontSize: 10),
        unselectedLabelStyle: const TextStyle(fontFamily: 'Outfit', fontSize: 10),
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
        items: [
          const BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.home_work_outlined),
            activeIcon: Icon(Icons.home_work),
            label: 'Registry',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.analytics_outlined),
            activeIcon: Icon(Icons.analytics),
            label: 'AI Valuation',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.link_outlined),
            activeIcon: Icon(Icons.link),
            label: 'Ledger',
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.bookmark_outline),
            activeIcon: const Icon(Icons.bookmark),
            label: role == 'Buyer' ? 'Bookings' : role == 'Seller' ? 'Sales' : 'Admin Logs',
          ),
        ],
      ),
      // FAB only available to Sellers and Admins
      floatingActionButton: (role == 'Seller' || role == 'Admin')
          ? FloatingActionButton(
              onPressed: _showAddPropertySheet,
              backgroundColor: const Color(0xFF8B5CF6),
              child: const Icon(Icons.add, color: Colors.white),
            )
          : null,
    );
  }
}
