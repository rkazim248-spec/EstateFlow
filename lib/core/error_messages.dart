import 'package:firebase_auth/firebase_auth.dart';

/// Maps Firebase auth failures to messages a person can act on.
String friendlyAuthError(Object error) {
  if (error is FirebaseAuthException) {
    return switch (error.code) {
      'invalid-email' => 'That email address is not valid.',
      'user-disabled' => 'This account has been disabled.',
      'user-not-found' => 'No account found with that email.',
      'wrong-password' => 'Incorrect email or password.',
      'invalid-credential' => 'Incorrect email or password.',
      'email-already-in-use' => 'An account already exists for that email.',
      'weak-password' => 'Please choose a stronger password.',
      'operation-not-allowed' =>
        'This sign-in method is disabled in the Firebase console.',
      'network-request-failed' => 'No network connection. Try again.',
      'too-many-requests' => 'Too many attempts. Please try again later.',
      'missing-id-token' => 'Google sign-in did not return an ID token.',
      _ => error.message ?? 'Something went wrong. Please try again.',
    };
  }
  return 'Something went wrong. Please try again.';
}
