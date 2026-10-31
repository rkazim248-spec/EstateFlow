// Firebase configuration for EstateFlow.
//
// Generated from the Firebase console configuration for project
// `estateflow-df9e9` (Android, iOS and Web app registrations).
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart'
    show TargetPlatform, defaultTargetPlatform, kIsWeb;

class DefaultFirebaseOptions {
  const DefaultFirebaseOptions._();

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyDBnN7MyfchMYtbpYNx9eohjNlBd8Y6A1w',
    appId: '1:353372777164:android:aabbdd6a8c6fd857a87069',
    messagingSenderId: '353372777164',
    projectId: 'estateflow-df9e9',
    storageBucket: 'estateflow-df9e9.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyDBnN7MyfchMYtbpYNx9eohjNlBd8Y6A1w',
    appId: '1:353372777164:ios:a721bbd7f680c488a87069',
    messagingSenderId: '353372777164',
    projectId: 'estateflow-df9e9',
    storageBucket: 'estateflow-df9e9.firebasestorage.app',
    iosBundleId: 'com.estateflow.app',
  );

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyDBnN7MyfchMYtbpYNx9eohjNlBd8Y6A1w',
    appId: '1:353372777164:web:e651246b6493aef9a87069',
    messagingSenderId: '353372777164',
    projectId: 'estateflow-df9e9',
    storageBucket: 'estateflow-df9e9.firebasestorage.app',
  );

  static FirebaseOptions get currentPlatform {
    if (kIsWeb) return web;
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.windows:
      case TargetPlatform.linux:
      case TargetPlatform.macOS:
      case TargetPlatform.fuchsia:
        throw UnsupportedError(
          'EstateFlow is configured for Android, iOS and Web.',
        );
    }
  }
}
