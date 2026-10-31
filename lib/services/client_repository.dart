import 'package:cloud_firestore/cloud_firestore.dart';

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

  /// Streams every client, alphabetically by name.
  Stream<List<Client>> watchAll() {
    return _collection
        .orderBy('name')
        .snapshots()
        .map((snapshot) =>
            snapshot.docs.map(Client.fromDocument).toList(growable: false));
  }

  /// Creates or updates a client.
  Future<void> save(Client client) async {
    final data = client.toMap();
    if (client.id == null) {
      await _collection.add(data);
    } else {
      await _collection.doc(client.id!).set(data, SetOptions(merge: true));
    }
  }

  Future<void> delete(String id) => _collection.doc(id).delete();
}
