import 'package:estateflow/core/constants.dart';
import 'package:estateflow/services/settings_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  test('starts on the system theme and the first accent', () async {
    final controller = SettingsController();
    await controller.load();

    expect(controller.themeMode, ThemeMode.system);
    expect(controller.accentIndex, 0);
    expect(controller.accentSeed, AccentColors.seeds.first);
    expect(controller.accentName, AccentColors.names.first);
  });

  test('persists the chosen theme', () async {
    final controller = SettingsController();
    await controller.load();
    await controller.setThemeMode(ThemeMode.dark);

    final restored = SettingsController();
    await restored.load();

    expect(restored.themeMode, ThemeMode.dark);
  });

  test('persists the chosen accent colour', () async {
    final controller = SettingsController();
    await controller.load();
    await controller.setAccentIndex(2);

    final restored = SettingsController();
    await restored.load();

    expect(restored.accentIndex, 2);
    expect(restored.accentSeed, AccentColors.seeds[2]);
  });

  test('ignores an accent index outside the palette', () async {
    final controller = SettingsController();
    await controller.load();

    await controller.setAccentIndex(99);
    expect(controller.accentIndex, 0);

    await controller.setAccentIndex(-1);
    expect(controller.accentIndex, 0);
  });
}
