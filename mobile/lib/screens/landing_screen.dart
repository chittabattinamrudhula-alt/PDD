import 'package:flutter/material.dart';

class LandingScreen extends StatelessWidget {
  final VoidCallback onLoginPressed;
  final VoidCallback onSignupPressed;

  const LandingScreen({
    super.key,
    required this.onLoginPressed,
    required this.onSignupPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF080511),
      body: Container(
        decoration: BoxDecoration(
          gradient: RadialGradient(
            center: Alignment.topCenter,
            radius: 1.5,
            colors: [
              const Color(0xFF8B5CF6).withOpacity(0.15),
              const Color(0xFF080511),
            ],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(height: 30),
                
                // Animated logo
                ShaderMask(
                  shaderCallback: (bounds) => const LinearGradient(
                    colors: [Color(0xFF8B5CF6), Color(0xFF06B6D4)],
                  ).createShader(bounds),
                  child: const Text(
                    "PropAI",
                    style: TextStyle(
                      color: Colors.white,
                      fontFamily: 'Outfit',
                      fontSize: 48,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                
                const Text(
                  "AI Appraisals & Blockchain Verification Registry",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 40),

                // Platform Feature Cards
                _buildHeroFeatureCard(
                  context,
                  "AI APPRAISALS",
                  "Fair Value Estimations",
                  "Input structure criteria to run neural valuation formulas, ROI growth timelines, and neighborhood averages.",
                  const Color(0xFF8B5CF6),
                  Icons.analytics_outlined,
                ),
                const SizedBox(height: 16),

                _buildHeroFeatureCard(
                  context,
                  "AUDIT FRAUD",
                  "Listing Anomaly Flags",
                  "Scans properties for listing cost warnings, dense layouts, typo anomalies, or unregistered listings.",
                  const Color(0xFFEF4444),
                  Icons.warning_amber_rounded,
                ),
                const SizedBox(height: 16),

                _buildHeroFeatureCard(
                  context,
                  "BLOCKCHAIN LEDGER",
                  "Title Deeds Verification",
                  "Records title deed history and purchase escrow reservations inside cryptographic block linked chains.",
                  const Color(0xFF06B6D4),
                  Icons.link,
                ),
                const SizedBox(height: 40),

                // Action buttons
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF8B5CF6),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 4,
                    ),
                    onPressed: onSignupPressed,
                    child: const Text(
                      "Create Vetted Account",
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0xFF7000FF), width: 1.5),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: onLoginPressed,
                    child: const Text(
                      "Portal Login",
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                    ),
                  ),
                ),
                const SizedBox(height: 30),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeroFeatureCard(
    BuildContext context,
    String badge,
    String title,
    String description,
    Color accentColor,
    IconData icon,
  ) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF0e0a22).withOpacity(0.65),
        border: Border.all(color: const Color(0xFF7000FF).withOpacity(0.15)),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: accentColor.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: accentColor, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  badge,
                  style: TextStyle(
                    color: accentColor,
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Outfit',
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  description,
                  style: const TextStyle(
                    color: Color(0xFF9CA3AF),
                    fontSize: 12,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
