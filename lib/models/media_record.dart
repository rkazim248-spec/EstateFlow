import 'package:cloud_firestore/cloud_firestore.dart';

/// A media file stored in Firebase Storage, with metadata in Firestore.
class MediaRecord {
  const MediaRecord({
    required this.id,
    required this.name,
    required this.storagePath,
    required this.contentType,
    required this.size,
    this.width,
    this.height,
    this.propertyId,
    this.source = 'upload',
    this.prompt,
    this.caption,
    this.createdAt,
  });

  final String id;
  final String name;
  final String storagePath;
  final String contentType;
  final int size;
  final int? width;
  final int? height;
  final String? propertyId;
  final String source;
  final String? prompt;
  final String? caption;
  final DateTime? createdAt;

  factory MediaRecord.fromMap(String id, Map<String, dynamic> data) {
    DateTime? parseDate(Object? value) {
      if (value is Timestamp) return value.toDate();
      if (value is DateTime) return value;
      if (value is String) return DateTime.tryParse(value);
      return null;
    }

    return MediaRecord(
      id: id,
      name: data['name'] as String? ?? '',
      storagePath: data['storagePath'] as String? ?? '',
      contentType: data['contentType'] as String? ?? 'image/png',
      size: (data['size'] as num?)?.toInt() ?? 0,
      width: (data['width'] as num?)?.toInt(),
      height: (data['height'] as num?)?.toInt(),
      propertyId: data['propertyId'] as String?,
      source: data['source'] as String? ?? 'upload',
      prompt: data['prompt'] as String?,
      caption: data['caption'] as String?,
      createdAt: parseDate(data['createdAt']),
    );
  }

  Map<String, dynamic> toMap() => {
        'name': name,
        'storagePath': storagePath,
        'contentType': contentType,
        'size': size,
        'width': width,
        'height': height,
        'propertyId': propertyId,
        'source': source,
        'prompt': prompt,
        'caption': caption,
        'createdAt': createdAt != null ? Timestamp.fromDate(createdAt!) : null,
      };
}