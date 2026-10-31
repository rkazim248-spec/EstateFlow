import 'dart:typed_data';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';

import '../models/media_record.dart';

/// Reads and writes media metadata in Firestore and binaries in Firebase Storage.
class MediaRepository {
  MediaRepository({this._firestore, this._storage});

  final FirebaseFirestore? _firestore;
  final FirebaseStorage? _storage;

  FirebaseFirestore get _db => _firestore ?? FirebaseFirestore.instance;
  FirebaseStorage get _storageInstance => _storage ?? FirebaseStorage.instance;

  String get _uid => FirebaseAuth.instance.currentUser!.uid;

  CollectionReference<Map<String, dynamic>> get _collection =>
      _db.collection('users').doc(_uid).collection('media');

  Stream<List<MediaRecord>> watchAll() {
    return _collection
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => MediaRecord.fromMap(doc.id, doc.data()))
            .toList(growable: false));
  }

  Future<MediaRecord> upload({
    required Uint8List bytes,
    required String contentType,
    required String name,
    String source = 'upload',
    String? prompt,
    String? caption,
  }) async {
    if (!contentType.startsWith('image/')) {
      throw Exception('Only image files can be added to the media library.');
    }
    if (bytes.length > 10 * 1024 * 1024) {
      throw Exception('Images must be 10 MB or smaller.');
    }

    final id = _generateId();
    final extension = _extensionFor(contentType);
    final storagePath = 'users/$_uid/media/$id.$extension';
    final ref = _storageInstance.ref(storagePath);

    final metadata = SettableMetadata(contentType: contentType);
    await ref.putData(bytes, metadata);

    final now = DateTime.now();
    final record = MediaRecord(
      id: id,
      name: name,
      storagePath: storagePath,
      contentType: contentType,
      size: bytes.length,
      source: source,
      prompt: prompt,
      caption: caption,
      createdAt: now,
    );

    await _collection.doc(id).set(record.toMap());

    return record;
  }

  Future<void> delete(MediaRecord media) async {
    try {
      await _storageInstance.ref(media.storagePath).delete();
    } catch (e) {
      // Object may not exist; continue to delete metadata
    }
    await _collection.doc(media.id).delete();
  }

  Future<String> getDownloadUrl(String storagePath) async {
    return _storageInstance.ref(storagePath).getDownloadURL();
  }

  String _generateId() {
    return '${DateTime.now().millisecondsSinceEpoch}-${DateTime.now().microsecond}';
  }

  String _extensionFor(String contentType) {
    if (contentType.contains('jpeg')) return 'jpg';
    if (contentType.contains('webp')) return 'webp';
    if (contentType.contains('gif')) return 'gif';
    return 'png';
  }
}