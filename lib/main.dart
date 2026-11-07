import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'core/app_theme.dart';
import 'core/settings_scope.dart';
import 'screens/auth/login_screen.dart';
import 'screens/home/home_shell.dart';
import 'services/auth_service.dart';
import 'services/settings_controller.dart';
import 'supabase_config.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final settings = SettingsController();
  await settings.load();

  try {
    await Supabase.initialize(
      url: SupabaseConfig.url,
      publishableKey: SupabaseConfig.publishableKey,
    );
  } catch (error) {
    runApp(_StartupFailureApp(error: error));
    return;
  }

  runApp(EstateFlowApp(settings: settings, authService: AuthService()));
}

/// Root widget: owns the theme and swaps between the auth and app shells.
class EstateFlowApp extends StatelessWidget {
  const EstateFlowApp({
    super.key,
    required this.settings,
    required this.authService,
  });

  final SettingsController settings;
  final AuthService authService;

  @override
  Widget build(BuildContext context) {
    return SettingsScope(
      controller: settings,
      child: AnimatedBuilder(
        animation: settings,
        builder: (context, _) {
          return MaterialApp(
            title: 'EstateFlow',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.light(settings.accentSeed),
            darkTheme: AppTheme.dark(settings.accentSeed),
            themeMode: settings.themeMode,
            home: AuthGate(authService: authService),
          );
        },
      ),
    );
  }
}

/// Chooses the login screen or the signed-in shell based on the auth state.
class AuthGate extends StatelessWidget {
  const AuthGate({super.key, required this.authService});

  final AuthService authService;

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<AuthState>(
      stream: Supabase.instance.client.auth.onAuthStateChange,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        final session = snapshot.data?.session;
        if (session == null) {
          return LoginScreen(authService: authService);
        }
        return HomeShell(authService: authService);
      },
    );
  }
}

/// Shown when Supabase cannot start.
class _StartupFailureApp extends StatelessWidget {
  const _StartupFailureApp({required this.error});

  final Object error;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error_outline, size: 48),
                const SizedBox(height: 16),
                const Text(
                  'EstateFlow could not start',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                Text(
                  '$error',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 13),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}