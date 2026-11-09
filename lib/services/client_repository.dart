import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

import '../core/constants.dart';
import '../models/client.dart';

/// Reads and writes the `clients` collection.
class ClientRepository {
  ClientRepository([this._firestore]);

  final FirebaseFirestore? _firestore;

  /// Resolved lazily so the repository can be constructed before Firebase is
  /// initialised, and so tests can inject a fake.
  FirebaseFirestore get _db => _firestore ?? FirebaseFirestore.instance;

  CollectionReference<Map<String, dynamic>> get _collection =>
      _db.collection(Collections.clients);

  /// Streams clients owned by the current user, alphabetically by name.
  Stream<List<Client>> watchAll() {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    if (uid == null) return Stream.value(const <Client>[]);
    return _collection
        .where('ownerId', isEqualTo: uid)
        .orderBy('name')
        .snapshots()
        .map((snapshot) =>
            snapshot.docs.map(Client.fromDocument).toList(growable: false));
  }

  /// Creates or updates a client.
  Future<void> save(Client client) async {
    final uid = FirebaseAuth.instance.currentUser?.uid;
    final data = client.toMap();
    data['ownerId'] = uid;
    if (client.id == null) {
      await _collection.add(data);
    } else {
      await _collection.doc(client.id!).set(data, SetOptions(merge: true));
    }
  }

  Future<void> delete(String id) => _collection.doc(id).delete();
}