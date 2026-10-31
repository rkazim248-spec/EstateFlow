import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:google_sign_in/google_sign_in.dart';

import '../core/constants.dart';

/// Wraps Firebase Authentication and the Google Sign-In flow.
class AuthService {
  AuthService([this._auth, this._googleSignIn]);

  final FirebaseAuth? _auth;
  final GoogleSignIn? _googleSignIn;

  /// Resolved lazily so the service can be constructed before Firebase has
  /// been initialised, and so tests can inject a fake.
  FirebaseAuth get _firebaseAuth => _auth ?? FirebaseAuth.instance;

  GoogleSignIn get _google => _googleSignIn ?? GoogleSignIn.instance;

  /// `GoogleSignIn.initialize` must run exactly once per process.
  static bool _googleInitialized = false;

  Future<void> _ensureGoogleInitialized() async {
    if (_googleInitialized) return;
    await _google.initialize(
      // Android reads the server client id from google-services.json and iOS
      // from GoogleService-Info.plist; the web SDK needs to be told.
      clientId: kIsWeb ? GoogleOAuth.webClientId : null,
    );
    _googleInitialized = true;
  }

  Stream<User?> get authStateChanges => _firebaseAuth.authStateChanges();

  User? get currentUser => _firebaseAuth.currentUser;

  /// Returns the current user's Firebase ID token.
  Future<String?> getIdToken() async {
    return _firebaseAuth.currentUser?.getIdToken();
  }

  Future<UserCredential> signInWithEmail(String email, String password) {
    return _firebaseAuth.signInWithEmailAndPassword(
      email: email,
      password: password,
    );
  }

  Future<UserCredential> signUpWithEmail(String email, String password) {
    return _firebaseAuth.createUserWithEmailAndPassword(
      email: email,
      password: password,
    );
  }

  /// Runs the Google account chooser and exchanges the resulting ID token for
  /// a Firebase credential.
  Future<UserCredential> signInWithGoogle() async {
    await _ensureGoogleInitialized();
    final account = await _google.authenticate(
      scopeHint: const ['email', 'profile'],
    );
    final idToken = account.authentication.idToken;
    if (idToken == null) {
      throw FirebaseAuthException(
        code: 'missing-id-token',
        message: 'Google sign-in did not return an ID token.',
      );
    }
    final credential = GoogleAuthProvider.credential(idToken: idToken);
    return _firebaseAuth.signInWithCredential(credential);
  }

  Future<void> signOut() async {
    try {
      await _google.signOut();
    } catch (_) {
      // The Google session may never have been started; ignore.
    }
    await _firebaseAuth.signOut();
  }
}
