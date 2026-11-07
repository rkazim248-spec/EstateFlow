import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/client.dart';

/// Reads and writes the `clients` table in Supabase.
class ClientRepository {
  ClientRepository([this._client]);

  final SupabaseClient? _client;

  SupabaseClient get _db => _client ?? Supabase.instance.client;

  /// Streams every client owned by the current user, alphabetically by name.
  Stream<List<Client>> watchAll() {
    final uid = _db.auth.currentUser?.id;
    if (uid == null) return Stream.value(const <Client>[]);

    return _db
        .from('clients')
        .stream(primaryKey: ['id'])
        .eq('owner_id', uid)
        .order('name')
        .map((rows) => rows.map((row) => Client.fromMap(row['id'] as String, row)).toList(growable: false));
  }

  /// Creates or updates a client.
  Future<void> save(Client client) async {
    final uid = _db.auth.currentUser?.id;
    final data = client.toMap();
    data['owner_id'] = uid;

    if (client.id == null) {
      await _db.from('clients').insert(data);
    } else {
      await _db.from('clients').update(data).eq('id', client.id!);
    }
  }

  Future<void> delete(String id) async {
    await _db.from('clients').delete().eq('id', id);
  }
}