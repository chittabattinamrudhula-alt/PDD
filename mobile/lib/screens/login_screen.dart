import 'package:flutter/material.dart';
import '../models/property.dart';
import '../services/api_service.dart';

class LoginScreen extends StatefulWidget {
  final bool initialIsSignup;
  final Function(User) onAuthSuccess;
  final VoidCallback onCancel;

  const LoginScreen({
    super.key,
    required this.initialIsSignup,
    required this.onAuthSuccess,
    required this.onCancel,
  });

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  late bool _isSignup;
  final ApiService _apiService = ApiService();
  final _formKey = GlobalKey<FormState>();

  String _email = "";
  String _password = "";
  String _name = "";
  String _role = "Buyer"; // 'Buyer' | 'Seller'
  bool _isLoading = false;
  String _errorMessage = "";

  @override
  void initState() {
    super.initState();
    _isSignup = widget.initialIsSignup;
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();

    setState(() {
      _isLoading = true;
      _errorMessage = "";
    });

    try {
      User user;
      if (_isSignup) {
        user = await _apiService.signup(_email, _password, _name, _role);
      } else {
        user = await _apiService.login(_email, _password);
      }
      widget.onAuthSuccess(user);
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll("Exception: ", "");
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
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: widget.onCancel,
        ),
        title: Text(
          _isSignup ? "Create Profile" : "Portal Login",
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontFamily: 'Outfit'),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 30),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _isSignup ? "Register Vetted Account" : "Welcome Back",
                style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold, fontFamily: 'Outfit'),
              ),
              const SizedBox(height: 6),
              Text(
                _isSignup ? "Configure account to view properties." : "Access your real estate analytics vault.",
                style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 13),
              ),
              const SizedBox(height: 24),

              if (_errorMessage.isNotEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.bottom(20),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEF4444).withOpacity(0.05),
                    border: Border.all(color: const Color(0xFFEF4444).withOpacity(0.3)),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _errorMessage,
                    style: const TextStyle(color: Color(0xFFFCA5A5), fontSize: 12),
                  ),
                ),

              if (_isSignup) ...[
                _buildLabel("Full Name"),
                TextFormField(
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                  decoration: _inputDecoration("e.g. John Doe"),
                  validator: (v) => v == null || v.isEmpty ? "Required" : null,
                  onSaved: (v) => _name = v ?? "",
                ),
                const SizedBox(height: 16),
              ],

              _buildLabel("Email Address"),
              TextFormField(
                style: const TextStyle(color: Colors.white, fontSize: 14),
                keyboardType: TextInputType.emailAddress,
                decoration: _inputDecoration("e.g. buyer@propai.com"),
                validator: (v) => v == null || v.isEmpty ? "Required" : null,
                onSaved: (v) => _email = v ?? "",
              ),
              const SizedBox(height: 16),

              _buildLabel("Password"),
              TextFormField(
                style: const TextStyle(color: Colors.white, fontSize: 14),
                obscureText: true,
                decoration: _inputDecoration("••••••••"),
                validator: (v) => v == null || v.isEmpty ? "Required" : null,
                onSaved: (v) => _password = v ?? "",
              ),
              const SizedBox(height: 20),

              if (_isSignup) ...[
                _buildLabel("Account Role"),
                Row(
                  children: [
                    Expanded(child: _buildRoleCard("Buyer", "Acquire & Book")),
                    const SizedBox(width: 12),
                    Expanded(child: _buildRoleCard("Seller", "List & Sell")),
                  ],
                ),
                const SizedBox(height: 30),
              ],

              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF8B5CF6),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onPressed: _isLoading ? null : _submit,
                  child: _isLoading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : Text(
                          _isSignup ? "Sign Up" : "Sign In",
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                ),
              ),
              const SizedBox(height: 20),

              Center(
                child: TextButton(
                  onPressed: () {
                    setState(() {
                      _isSignup = !_isSignup;
                      _errorMessage = "";
                    });
                  },
                  child: RichText(
                    text: TextSpan(
                      text: _isSignup ? "Already have an account? " : "Don't have an account? ",
                      style: const TextStyle(color: Colors.grey, fontSize: 13),
                      children: [
                        TextSpan(
                          text: _isSignup ? "Log In" : "Sign Up",
                          style: const TextStyle(color: Color(0xFF06B6D4), fontWeight: FontWeight.bold),
                        )
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Seed Accounts Help Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF0e0a22),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white.withOpacity(0.03)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text(
                      "Local Test Credentials:",
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12, fontFamily: 'Outfit'),
                    ),
                    SizedBox(height: 8),
                    Text("• Buyer: buyer@propai.com / password", style: TextStyle(color: Colors.grey, fontSize: 11)),
                    SizedBox(height: 4),
                    Text("• Seller: seller@propai.com / password", style: TextStyle(color: Colors.grey, fontSize: 11)),
                    SizedBox(height: 4),
                    Text("• Admin: admin@propai.com / password", style: TextStyle(color: Colors.grey, fontSize: 11)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRoleCard(String r, String subtitle) {
    final isSelected = _role == r;
    return GestureDetector(
      onTap: () {
        setState(() {
          _role = r;
        });
      },
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF8B5CF6).withOpacity(0.12) : const Color(0xFF0e0a22),
          border: Border.all(color: isSelected ? const Color(0xFF8B5CF6) : Colors.white12, width: 1.5),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          children: [
            Text(
              r,
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: const TextStyle(color: Colors.grey, fontSize: 10),
            ),
          ],
        ),
      ),
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

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      filled: true,
      fillColor: const Color(0xFF080511),
      hintText: hint,
      hintStyle: const TextStyle(color: Colors.white24, fontSize: 13),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
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
