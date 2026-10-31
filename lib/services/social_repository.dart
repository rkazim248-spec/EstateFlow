import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

import '../models/social_post.dart';

/// Reads and writes social media drafts in Firestore.
class SocialRepository {
  SocialRepository({this._firestore});

  final FirebaseFirestore? _firestore;

  FirebaseFirestore get _db => _firestore ?? FirebaseFirestore.instance;

  String get _uid => FirebaseAuth.instance.currentUser!.uid;

  CollectionReference<Map<String, dynamic>> get _collection =>
      _db.collection('users').doc(_uid).collection('socialPosts');

  Stream<List<SocialPost>> watchAll() {
    return _collection
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => SocialPost.fromMap(doc.id, doc.data()))
            .toList(growable: false));
  }

  Future<String> createDraft({
    required String caption,
    required String hashtags,
    String? mediaId,
    String? mediaUrl,
    required List<String> destinations,
    String status = 'draft',
    DateTime? scheduledFor,
    String timeZone = 'Asia/Karachi',
  }) async {
    final now = DateTime.now();
    final doc = await _collection.add({
      'caption': caption.trim(),
      'hashtags': hashtags.trim(),
      'mediaId': mediaId,
      'mediaUrl': mediaUrl,
      'destinations': destinations,
      'status': status,
      'scheduledFor': scheduledFor != null ? Timestamp.fromDate(scheduledFor) : null,
      'timeZone': timeZone,
      'createdAt': Timestamp.fromDate(now),
      'updatedAt': Timestamp.fromDate(now),
    });
    return doc.id;
  }

  Future<void> delete(String id) async {
    await _collection.doc(id).delete();
  }
}