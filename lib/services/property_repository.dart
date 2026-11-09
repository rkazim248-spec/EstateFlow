import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

import '../core/constants.dart';
import '../models/property.dart';

/// Reads and writes the `properties` collection.
class PropertyRepository {
  PropertyRepository([this._firestore]);

  final FirebaseFirestore? _firestore;

  /// Resolved lazily so the repository can be constructed before Firebase is
  /// initialised, and so tests can inject a fake.
  FirebaseFirestore get _db => _firestore ?? FirebaseFirestore.instance;

  CollectionReference<Map<String, dynamic>> get _collection =>
      _db.collection(Collections.properties);

  /// Streams listings owned by the current user, newest first.
  Stream<List<Property>> watchAll() {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) return Stream.value(const <Property>[]);
    return _collection
        .where('ownerId', isEqualTo: uid)
        .orderBy('name')
        .snapshots()
        .map((snapshot) =>
            snapshot.docs.map(Property.fromDocument).toList(growable: false));
  }

  /// Creates or updates a listing.
  Future<void> save(Property property) async {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    final data = property.toMap();
    data['ownerId'] = uid;
    if (property.id == null) {
      await _collection.add(data);
    } else {
      await _collection.doc(property.id!).set(data, SetOptions(merge: true));
    }
  }

  Future<void> delete(String id) => _collection.doc(id).delete();
}