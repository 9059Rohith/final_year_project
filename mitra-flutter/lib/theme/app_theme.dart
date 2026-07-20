import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  // Primary warm orange palette
  static const primary = Color(0xFFFF6B35);
  static const primaryLight = Color(0xFFFF9A6C);
  static const primaryDark = Color(0xFFE04E1A);

  // Secondary
  static const secondary = Color(0xFF7C3AED);
  static const secondaryLight = Color(0xFFA78BFA);

  // Accent
  static const teal = Color(0xFF00B4D8);
  static const tealLight = Color(0xFF90E0EF);
  static const pink = Color(0xFFEC4899);
  static const pinkLight = Color(0xFFFBCFE8);
  static const sunny = Color(0xFFFBBF24);
  static const sunnyLight = Color(0xFFFDE68A);
  static const green = Color(0xFF10B981);
  static const greenLight = Color(0xFFD1FAE5);
  static const coral = Color(0xFFFF7E67);

  // Backgrounds
  static const calmBg = Color(0xFFFFF7F0);
  static const cardBg = Color(0xFFFFFFFF);
  static const surfaceBg = Color(0xFFFEF3E8);

  // Text
  static const textPrimary = Color(0xFF1A1A2E);
  static const textSecondary = Color(0xFF6B7280);
  static const textMuted = Color(0xFF9CA3AF);

  // Gradients
  static const List<Color> warmGradient = [Color(0xFFFF6B35), Color(0xFFFF9A6C)];
  static const List<Color> playGradient = [Color(0xFF7C3AED), Color(0xFFEC4899)];
  static const List<Color> calmGradient = [Color(0xFF0EA5E9), Color(0xFF6366F1)];
  static const List<Color> sunnyGradient = [Color(0xFFF59E0B), Color(0xFFFF6B35)];
  static const List<Color> greenGradient = [Color(0xFF10B981), Color(0xFF0EA5E9)];
  static const List<Color> scoreGoodGradient = [Color(0xFF10B981), Color(0xFF34D399)];
  static const List<Color> scoreMidGradient = [Color(0xFFF59E0B), Color(0xFFFBBF24)];
  static const List<Color> scoreLowGradient = [Color(0xFFEF4444), Color(0xFFF87171)];

  static const List<List<Color>> lessonGradients = [
    [Color(0xFFEC4899), Color(0xFFFF7E67)],
    [Color(0xFF00B4D8), Color(0xFF7C3AED)],
    [Color(0xFF10B981), Color(0xFF0EA5E9)],
    [Color(0xFFFBBF24), Color(0xFFFF6B35)],
    [Color(0xFF8B5CF6), Color(0xFFEC4899)],
    [Color(0xFF06B6D4), Color(0xFF10B981)],
  ];
}

class AppTheme {
  static ThemeData get light => ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppColors.primary,
          primary: AppColors.primary,
          secondary: AppColors.secondary,
          surface: AppColors.cardBg,
          background: AppColors.calmBg,
        ),
        scaffoldBackgroundColor: AppColors.calmBg,
        textTheme: GoogleFonts.poppinsTextTheme().copyWith(
          displayLarge: GoogleFonts.poppins(
            fontSize: 32,
            fontWeight: FontWeight.w900,
            color: AppColors.textPrimary,
          ),
          displayMedium: GoogleFonts.poppins(
            fontSize: 26,
            fontWeight: FontWeight.w800,
            color: AppColors.textPrimary,
          ),
          titleLarge: GoogleFonts.poppins(
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
          titleMedium: GoogleFonts.poppins(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: AppColors.textPrimary,
          ),
          bodyLarge: GoogleFonts.poppins(
            fontSize: 16,
            fontWeight: FontWeight.w400,
            color: AppColors.textPrimary,
          ),
          bodyMedium: GoogleFonts.poppins(
            fontSize: 14,
            color: AppColors.textSecondary,
          ),
          labelLarge: GoogleFonts.poppins(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.5,
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(18),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
            elevation: 4,
          ),
        ),
        cardTheme: CardTheme(
          color: AppColors.cardBg,
          elevation: 6,
          shadowColor: AppColors.primary.withOpacity(0.12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide(color: AppColors.primaryLight.withOpacity(0.4)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide(color: AppColors.textMuted.withOpacity(0.3)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: AppColors.primary, width: 2),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: Colors.red),
          ),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.transparent,
          elevation: 0,
          scrolledUnderElevation: 0,
          iconTheme: IconThemeData(color: Colors.white),
          titleTextStyle: TextStyle(
            color: Colors.white,
            fontSize: 22,
            fontWeight: FontWeight.w800,
          ),
        ),
        snackBarTheme: SnackBarThemeData(
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
      );
}
