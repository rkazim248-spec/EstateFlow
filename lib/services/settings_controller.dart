import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/constants.dart';

/// Persists the user's appearance preferences.
class SettingsController extends ChangeNotifier {
  static const String _themeKey = 'estateflow.themeMode';
  static const String _accentKey = 'estateflow.accentIndex';

  ThemeMode _themeMode = ThemeMode.system;
  int _accentIndex = 0;

  ThemeMode get themeMode => _themeMode;

  int get accentIndex => _accentIndex;

  Color get accentSeed => AccentColors.seeds[_accentIndex];

  String get accentName => AccentColors.names[_accentIndex];

  /// Reads the stored preferences. Safe to call before `runApp`.
  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final storedMode = prefs.getString(_themeKey);
    _themeMode = switch (storedMode) {
      'light' => ThemeMode.light,
      'dark' => ThemeMode.dark,
      _ => ThemeMode.system,
    };
    final storedAccent = prefs.getInt(_accentKey);
    if (storedAccent != null && storedAccent >= 0 && storedAccent < AccentColors.seeds.length) {
      _accentIndex = storedAccent;
    }
    notifyListeners();
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    if (_themeMode == mode) return;
    _themeMode = mode;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_themeKey, mode.name);
  }

  Future<void> setAccentIndex(int index) async {
    if (index < 0 || index >= AccentColors.seeds.length) return;
    _accentIndex = index;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_accentKey, index);
  }
}
