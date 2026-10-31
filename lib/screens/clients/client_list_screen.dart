import 'package:flutter/material.dart';

import '../../core/constants.dart';
import '../../core/matching.dart';
import '../../models/client.dart';
import '../../models/property.dart';
import '../../services/client_repository.dart';
import '../../services/property_repository.dart';
import '../../widgets/status_chip.dart';
import 'client_detail_screen.dart';
import 'client_form_screen.dart';

/// Browsable list of every client, with search, filters and actions.
class ClientListScreen extends StatefulWidget {
  const ClientListScreen({
    super.key,
    this.repository,
    this.propertyRepository,
  });

  /// Overridable so the list can be rendered without a live connection.
  final ClientRepository? repository;
  final PropertyRepository? propertyRepository;

  @override
  State<ClientListScreen> createState() => _ClientListScreenState();
}

class _ClientListScreenState extends State<ClientListScreen> {
  late final ClientRepository _repository =
      widget.repository ?? ClientRepository();
  late final PropertyRepository _propertyRepository =
      widget.propertyRepository ?? PropertyRepository();
  final _searchController = TextEditingController();

  String _query = '';
  String? _purpose;
  String? _type;
  String? _status;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  bool _matches(Client client) {
    final query = _query.trim().toLowerCase();
    if (query.isNotEmpty) {
      final haystack =
          '${client.name} ${client.location} ${client.phone}'.toLowerCase();
      if (!haystack.contains(query)) return false;
    }
    if (_purpose != null && client.purpose != _purpose) return false;
    if (_type != null && client.type != _type) return false;
    if (_status != null && client.status != _status) return false;
    return true;
  }

  Future<void> _openForm([Client? client]) async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => ClientFormScreen(repository: _repository, client: client),
      ),
    );
  }

  void _openDetails(Client client) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => ClientDetailScreen(client: client),
      ),
    );
  }

  Future<void> _confirmDelete(Client client) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete client?'),
        content: Text('"${client.name}" will be removed permanently.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;
    try {
      await _repository.delete(client.id!);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Client deleted')),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not delete the client')),
      );
    }
  }

  Future<void> _showMatches(Client client) async {
    final properties = await _propertyRepository.watchAll().first;
    final matches = matchPropertiesForClient(client, properties);

    if (!mounted) return;
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (context) => _MatchSheet(client: client, matches: matches),
    );
  }

  Future<void> _openFilters() async {
    final result = await showModalBottomSheet<_ClientFilter>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (context) => _ClientFilterSheet(
        purpose: _purpose,
        type: _type,
        status: _status,
      ),
    );
    if (result == null) return;
    setState(() {
      _purpose = result.purpose;
      _type = result.type;
      _status = result.status;
    });
  }

  bool get _hasFilters => _purpose != null || _type != null || _status != null;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Clients'),
        actions: [
          IconButton(
            onPressed: _openFilters,
            tooltip: 'Filter',
            icon: Badge(
              isLabelVisible: _hasFilters,
              child: const Icon(Icons.filter_list),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openForm,
        icon: const Icon(Icons.add),
        label: const Text('Client'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
            child: TextField(
              controller: _searchController,
              onChanged: (value) => setState(() => _query = value),
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search by name, location or phone',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _query.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _query = '');
                        },
                      ),
              ),
            ),
          ),
          Expanded(
            child: StreamBuilder<List<Client>>(
              stream: _repository.watchAll(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snapshot.hasError) {
                  return Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text('Could not load clients.'),
                        const SizedBox(height: 12),
                        OutlinedButton(
                          onPressed: () => setState(() {}),
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  );
                }

                final all = snapshot.data ?? const <Client>[];
                final clients = all.where(_matches).toList();

                if (clients.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.people_outline,
                            size: 48,
                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            all.isEmpty ? 'No clients yet' : 'No matches',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            all.isEmpty
                                ? 'Add your first client to start matching listings.'
                                : 'Try clearing the search or filters.',
                            textAlign: TextAlign.center,
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: Theme.of(context)
                                      .colorScheme
                                      .onSurfaceVariant,
                                ),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                return ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 96),
                  itemCount: clients.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final client = clients[index];
                    return _ClientCard(
                      client: client,
                      onView: () => _openDetails(client),
                      onEdit: () => _openForm(client),
                      onDelete: () => _confirmDelete(client),
                      onMatch: () => _showMatches(client),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _ClientCard extends StatelessWidget {
  const _ClientCard({
    required this.client,
    required this.onView,
    required this.onEdit,
    required this.onDelete,
    required this.onMatch,
  });

  final Client client;
  final VoidCallback onView;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final VoidCallback onMatch;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onView,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 8, 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            client.name,
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            client.budgetLabel,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: scheme.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    StatusChip(status: client.status),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    _MiniChip(label: client.purpose),
                    _MiniChip(label: client.type),
                    _MiniChip(label: client.resolvedBedrooms),
                    if (client.location.isNotEmpty)
                      _MiniChip(label: client.location),
                  ],
                ),
              ),
              const SizedBox(height: 4),
              const Divider(),
              // A wrap keeps every action reachable on narrow screens instead
              // of letting the row overflow.
              Wrap(
                spacing: 4,
                runSpacing: 4,
                children: [
                  TextButton.icon(
                    onPressed: onView,
                    icon: const Icon(Icons.visibility_outlined, size: 18),
                    label: const Text('View'),
                  ),
                  TextButton.icon(
                    onPressed: onEdit,
                    icon: const Icon(Icons.edit_outlined, size: 18),
                    label: const Text('Edit'),
                  ),
                  TextButton.icon(
                    onPressed: onMatch,
                    icon: const Icon(Icons.handshake_outlined, size: 18),
                    label: const Text('Match'),
                  ),
                  IconButton(
                    onPressed: onDelete,
                    icon: const Icon(Icons.delete_outline),
                    tooltip: 'Delete',
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MiniChip extends StatelessWidget {
  const _MiniChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: scheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: scheme.onSurfaceVariant,
        ),
      ),
    );
  }
}

class _MatchSheet extends StatelessWidget {
  const _MatchSheet({required this.client, required this.matches});

  final Client client;
  final List<Property> matches;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Matching properties',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'For ${client.name} · ${client.purpose} · ${client.type} · ${client.budgetLabel}',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 16),
            if (matches.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: Center(
                  child: Text(
                    'No properties match this client yet.',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
              )
            else
              Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: matches.length,
                  separatorBuilder: (_, _) => const Divider(),
                  itemBuilder: (context, index) {
                    final property = matches[index];
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(
                        property.name,
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      subtitle: Text(
                        '${property.type} · ${property.priceLabel}',
                      ),
                      trailing: StatusChip(status: property.status),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _ClientFilter {
  const _ClientFilter({this.purpose, this.type, this.status});

  final String? purpose;
  final String? type;
  final String? status;
}

class _ClientFilterSheet extends StatefulWidget {
  const _ClientFilterSheet({this.purpose, this.type, this.status});

  final String? purpose;
  final String? type;
  final String? status;

  @override
  State<_ClientFilterSheet> createState() => _ClientFilterSheetState();
}

class _ClientFilterSheetState extends State<_ClientFilterSheet> {
  late String? _purpose = widget.purpose;
  late String? _type = widget.type;
  late String? _status = widget.status;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Filter clients',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 16),
            _FilterGroup(
              label: 'Purpose',
              values: const [null, ...ClientPurpose.values],
              selected: _purpose,
              onSelected: (value) => setState(() => _purpose = value),
            ),
            _FilterGroup(
              label: 'Type',
              values: const [null, ...PropertyType.values],
              selected: _type,
              onSelected: (value) => setState(() => _type = value),
            ),
            _FilterGroup(
              label: 'Status',
              values: const [null, ...ClientStatus.values],
              selected: _status,
              onSelected: (value) => setState(() => _status = value),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(
                      const _ClientFilter(),
                    ),
                    child: const Text('Clear'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton(
                    onPressed: () => Navigator.of(context).pop(
                      _ClientFilter(
                        purpose: _purpose,
                        type: _type,
                        status: _status,
                      ),
                    ),
                    child: const Text('Apply'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterGroup extends StatelessWidget {
  const _FilterGroup({
    required this.label,
    required this.values,
    required this.selected,
    required this.onSelected,
  });

  final String label;
  final List<String?> values;
  final String? selected;
  final ValueChanged<String?> onSelected;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: theme.textTheme.labelLarge?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: values.map((value) {
              return ChoiceChip(
                label: Text(value ?? 'All'),
                selected: selected == value,
                onSelected: (_) => onSelected(value),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}
