import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';

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

  FirebaseFirestore.instance.settings = const Settings(
    persistenceEnabled: true,
    cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
  );
}