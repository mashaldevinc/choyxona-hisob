import 'package:flutter/material.dart';

const kPrimary = Color(0xFFC17A3E);
const kPrimaryDark = Color(0xFFD4944E);
const kBgLight = Color(0xFFFDF6EE);
const kBgDark = Color(0xFF1A120B);
const kCardLight = Color(0xFFFFFFFF);
const kCardDark = Color(0xFF2D1B0E);
const kSecondaryLight = Color(0xFFF5E6D3);
const kSecondaryDark = Color(0xFF3D2512);
const kSuccess = Color(0xFF22C55E);
const kWarning = Color(0xFFF59E0B);
const kDestructive = Color(0xFFEF4444);

ThemeData buildLightTheme() {
  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    colorScheme: ColorScheme.light(
      primary: kPrimary,
      secondary: kSecondaryLight,
      surface: kCardLight,
      background: kBgLight,
      onPrimary: Colors.white,
      onSecondary: kPrimary,
      onSurface: const Color(0xFF1A120B),
      outline: const Color(0xFFE8D5C0),
    ),
    scaffoldBackgroundColor: kBgLight,
    cardColor: kCardLight,
    appBarTheme: const AppBarTheme(
      backgroundColor: kBgLight,
      foregroundColor: Color(0xFF1A120B),
      elevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        color: Color(0xFF1A120B),
        fontSize: 22,
        fontWeight: FontWeight.w700,
      ),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: kCardLight,
      selectedItemColor: kPrimary,
      unselectedItemColor: Color(0xFF9B8572),
      type: BottomNavigationBarType.fixed,
      elevation: 8,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: kPrimary,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: kCardLight,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE8D5C0)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFE8D5C0)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: kPrimary, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: kSecondaryLight,
      labelStyle: const TextStyle(color: kPrimary, fontWeight: FontWeight.w600),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      side: BorderSide.none,
    ),
    dividerColor: const Color(0xFFE8D5C0),
    fontFamily: 'Roboto',
  );
}

ThemeData buildDarkTheme() {
  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: ColorScheme.dark(
      primary: kPrimaryDark,
      secondary: kSecondaryDark,
      surface: kCardDark,
      background: kBgDark,
      onPrimary: Colors.white,
      onSecondary: kPrimaryDark,
      onSurface: const Color(0xFFF5E6D3),
      outline: const Color(0xFF4A2E18),
    ),
    scaffoldBackgroundColor: kBgDark,
    cardColor: kCardDark,
    appBarTheme: const AppBarTheme(
      backgroundColor: kBgDark,
      foregroundColor: Color(0xFFF5E6D3),
      elevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        color: Color(0xFFF5E6D3),
        fontSize: 22,
        fontWeight: FontWeight.w700,
      ),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: kCardDark,
      selectedItemColor: kPrimaryDark,
      unselectedItemColor: Color(0xFF9B8572),
      type: BottomNavigationBarType.fixed,
      elevation: 8,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: kPrimaryDark,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: kCardDark,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF4A2E18)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFF4A2E18)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: kPrimaryDark, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),
    dividerColor: const Color(0xFF4A2E18),
    fontFamily: 'Roboto',
  );
}
