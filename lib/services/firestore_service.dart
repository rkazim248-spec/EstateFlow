import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart' show debugPrint, kIsWeb;

/// Turns on Firestore's offline cache so the dashboard and the lists stay
/// readable without a network connection and sync up when connectivity
/// returns.
///
/// Called once during startup, right after `Firebase.initializeApp`.
void configureFirestore() {
  if (kIsWeb) {
    // The web SDK already persists to IndexedDB and rejects the Android-style
    // cache size, so there is nothing to configure here.
    return;
  }

  try {
    FirebaseFirestore.instance.settings = const Settings(
      persistenceEnabled: true,
      cacheSizeBytes: 100 * 1024 * 1024, // 100 MB cache limit
    );
  } catch (e) {
    // Firestore settings may fail on some devices. Continue without custom settings.
    debugPrint('Firestore configuration failed: $e');
  }
}
