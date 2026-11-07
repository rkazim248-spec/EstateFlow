import 'package:supabase_flutter/supabase_flutter.dart';

/// Wraps Supabase Authentication.
class AuthService {
  AuthService([this._client]);

  final SupabaseClient? _client;

  SupabaseClient get _supabase => _client ?? Supabase.instance.client;

  Stream<AuthState> get authStateChanges => _supabase.auth.onAuthStateChange;

  User? get currentUser => _supabase.auth.currentUser;

  Future<AuthResponse> signInWithEmail(String email, String password) {
    return _supabase.auth.signInWithPassword(
      email: email,
      password: password,
    );
  }

  Future<AuthResponse> signUpWithEmail(String email, String password) {
    return _supabase.auth.signUp(
      email: email,
      password: password,
    );
  }

  Future<bool> signInWithGoogle() async {
    // Supabase Google OAuth requires platform-specific setup.
    // For now, redirect to Supabase OAuth flow.
    try {
      await _supabase.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: 'io.supabase.estateflow://login-callback/',
      );
      return true;
    } catch (e) {
      rethrow;
    }
  }

  Future<void> signOut() async {
    await _supabase.auth.signOut();
  }

  Future<String?> getIdToken() async {
    final session = _supabase.auth.currentSession;
    return session?.accessToken;
  }

  Future<void> updateDisplayName(String name) async {
    await _supabase.auth.updateUser(
      UserAttributes(data: {'display_name': name, 'full_name': name}),
    );
  }
}