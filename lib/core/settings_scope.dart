import 'package:flutter/widgets.dart';

import '../services/settings_controller.dart';

/// Makes the [SettingsController] available to the widget tree.
class SettingsScope extends InheritedNotifier<SettingsController> {
  const SettingsScope({
    super.key,
    required SettingsController controller,
    required super.child,
  }) : super(notifier: controller);

  static SettingsController of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<SettingsScope>();
    assert(scope != null, 'No SettingsScope found in the widget tree');
    return scope!.notifier!;
  }
}
