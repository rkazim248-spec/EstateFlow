import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/property.dart';

/// Reads and writes the `properties` table in Supabase.
class PropertyRepository {
  PropertyRepository([this._client]);

  final SupabaseClient? _client;

  SupabaseClient get _db => _client ?? Supabase.instance.client;

  /// Streams every listing owned by the current user, newest first.
  Stream<List<Property>> watchAll() {
    final uid = _db.auth.currentUser?.id;
    if (uid == null) return Stream.value(const <Property>[]);

    return _db
        .from('properties')
        .stream(primaryKey: ['id'])
        .eq('owner_id', uid)
        .order('name')
        .map((rows) => rows.map((row) => Property.fromMap(row['id'] as String, row)).toList(growable: false));
  }

  /// Creates or updates a listing.
  Future<void> save(Property property) async {
    final uid = _db.auth.currentUser?.id;
    final data = property.toMap();
    data['owner_id'] = uid;

    if (property.id == null) {
      await _db.from('properties').insert(data);
    } else {
      await _db.from('properties').update(data).eq('id', property.id!);
    }
  }

  Future<void> delete(String id) async {
    await _db.from('properties').delete().eq('id', id);
  }
}