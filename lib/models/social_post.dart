import 'package:cloud_firestore/cloud_firestore.dart';

/// A social media draft stored in Firestore.
class SocialPost {
  const SocialPost({
    required this.id,
    required this.caption,
    this.hashtags = '',
    this.mediaId,
    this.mediaUrl,
    this.destinations = const [],
    this.status = 'draft',
    this.scheduledFor,
    this.timeZone = 'Asia/Karachi',
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String caption;
  final String hashtags;
  final String? mediaId;
  final String? mediaUrl;
  final List<String> destinations;
  final String status;
  final DateTime? scheduledFor;
  final String timeZone;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  factory SocialPost.fromMap(String id, Map<String, dynamic> data) {
    DateTime? parseDate(Object? value) {
      if (value is Timestamp) return value.toDate();
      if (value is DateTime) return value;
      if (value is String) return DateTime.tryParse(value);
      return null;
    }

    return SocialPost(
      id: id,
      caption: data['caption'] as String? ?? '',
      hashtags: data['hashtags'] as String? ?? '',
      mediaId: data['mediaId'] as String?,
      mediaUrl: data['mediaUrl'] as String?,
      destinations: (data['destinations'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      status: data['status'] as String? ?? 'draft',
      scheduledFor: parseDate(data['scheduledFor']),
      timeZone: data['timeZone'] as String? ?? 'Asia/Karachi',
      createdAt: parseDate(data['createdAt']),
      updatedAt: parseDate(data['updatedAt']),
    );
  }

  Map<String, dynamic> toMap() => {
        'caption': caption,
        'hashtags': hashtags,
        'mediaId': mediaId,
        'mediaUrl': mediaUrl,
        'destinations': destinations,
        'status': status,
        'scheduledFor': scheduledFor != null ? Timestamp.fromDate(scheduledFor!) : null,
        'timeZone': timeZone,
        'createdAt': createdAt != null ? Timestamp.fromDate(createdAt!) : null,
        'updatedAt': updatedAt != null ? Timestamp.fromDate(updatedAt!) : null,
      };
}