import 'package:flutter/material.dart';

import '../../core/constants.dart';
import '../../core/matching.dart';
import '../../models/client.dart';
import '../../models/property.dart';
import '../../services/client_repository.dart';
import '../../services/property_repository.dart';
import '../../widgets/status_chip.dart';
import 'property_detail_screen.dart';
import 'property_form_screen.dart';

/// Browsable list of every property, with search, filters and actions.
class PropertyListScreen extends StatefulWidget {
  const PropertyListScreen({
    super.key,
    this.repository,
    this.clientRepository,
  });

  /// Overridable so the list can be rendered without a live connection.
  final PropertyRepository? repository;
  final ClientRepository? clientRepository;

  @override
  State<PropertyListScreen> createState() => _PropertyListScreenState();
}

class _PropertyListScreenState extends State<PropertyListScreen> {
  late final PropertyRepository _repository =
      widget.repository ?? PropertyRepository();
  late final ClientRepository _clientRepository =
      widget.clientRepository ?? ClientRepository();
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

  bool _matches(Property property) {
    final query = _query.trim().toLowerCase();
    if (query.isNotEmpty) {
      final haystack =
          '${property.name} ${property.location} ${property.ownerName}'.toLowerCase();
      if (!haystack.contains(query)) return false;
    }
    if (_purpose != null && property.purpose != _purpose) return false;
    if (_type != null && property.type != _type) return false;
    if (_status != null && property.status != _status) return false;
    return true;
  }

  Future<void> _openForm([Property? property]) async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => PropertyFormScreen(
          repository: _repository,
          property: property,
        ),
      ),
    );
  }

  void _openDetails(Property property) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => PropertyDetailScreen(property: property),
      ),
    );
  }

  Future<void> _confirmDelete(Property property) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete property?'),
        content: Text(
          '"${property.name}" will be removed permanently.',
        ),
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
      await _repository.delete(property.id!);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Property deleted')),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not delete the property')),
      );
    }
  }

  Future<void> _showMatches(Property property) async {
    final clients = await _clientRepository.watchAll().first;
    final matches = matchClientsForProperty(property, clients);

    if (!mounted) return;
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (context) => _MatchSheet(property: property, matches: matches),
    );
  }

  Future<void> _openFilters() async {
    final result = await showModalBottomSheet<_PropertyFilter>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (context) => _PropertyFilterSheet(
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
        title: const Text('Properties'),
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
        label: const Text('Property'),
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
                hintText: 'Search by name, location or owner',
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
            child: StreamBuilder<List<Property>>(
              stream: _repository.watchAll(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snapshot.hasError) {
                  return _ErrorState(
                    message: 'Could not load properties.',
                    onRetry: () => setState(() {}),
                  );
                }

                final all = snapshot.data ?? const <Property>[];
                final properties = all.where(_matches).toList();

                if (properties.isEmpty) {
                  return _EmptyState(
                    title: all.isEmpty ? 'No properties yet' : 'No matches',
                    message: all.isEmpty
                        ? 'Add your first listing to get started.'
                        : 'Try clearing the search or filters.',
                    action: all.isEmpty
                        ? null
                        : TextButton(
                            onPressed: () {
                              _searchController.clear();
                              setState(() {
                                _query = '';
                                _purpose = null;
                                _type = null;
                                _status = null;
                              });
                            },
                            child: const Text('Clear filters'),
                          ),
                  );
                }

                return ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 96),
                  itemCount: properties.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final property = properties[index];
                    return _PropertyCard(
                      property: property,
                      onView: () => _openDetails(property),
                      onEdit: () => _openForm(property),
                      onDelete: () => _confirmDelete(property),
                      onMatch: () => _showMatches(property),
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

class _PropertyCard extends StatelessWidget {
  const _PropertyCard({
    required this.property,
    required this.onView,
    required this.onEdit,
    required this.onDelete,
    required this.onMatch,
  });

  final Property property;
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
                            property.name,
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            property.priceLabel,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: scheme.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    StatusChip(status: property.status),
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
                    _MiniChip(label: property.purpose),
                    _MiniChip(label: property.type),
                    _MiniChip(label: property.resolvedBedrooms),
                    if (property.location.isNotEmpty)
                      _MiniChip(label: property.location),
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
  const _MatchSheet({required this.property, required this.matches});

  final Property property;
  final List<Client> matches;

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
              'Matching clients',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'For ${property.name} · ${property.type} · ${property.priceLabel}',
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
                    'No clients match this listing yet.',
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
                    final client = matches[index];
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(
                        client.name,
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      subtitle: Text(
                        '${client.purpose} · ${client.type} · ${client.budgetLabel}',
                      ),
                      trailing: StatusChip(status: client.status),
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

class _PropertyFilter {
  const _PropertyFilter({this.purpose, this.type, this.status});

  final String? purpose;
  final String? type;
  final String? status;
}

class _PropertyFilterSheet extends StatefulWidget {
  const _PropertyFilterSheet({this.purpose, this.type, this.status});

  final String? purpose;
  final String? type;
  final String? status;

  @override
  State<_PropertyFilterSheet> createState() => _PropertyFilterSheetState();
}

class _PropertyFilterSheetState extends State<_PropertyFilterSheet> {
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
              'Filter properties',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 16),
            _FilterGroup(
              label: 'Purpose',
              values: const [null, ...PropertyPurpose.values],
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
              values: const [null, ...PropertyStatus.values],
              selected: _status,
              onSelected: (value) => setState(() => _status = value),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(
                      const _PropertyFilter(),
                    ),
                    child: const Text('Clear'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton(
                    onPressed: () => Navigator.of(context).pop(
                      _PropertyFilter(
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

class _EmptyState extends StatelessWidget {
  const _EmptyState({
    required this.title,
    required this.message,
    this.action,
  });

  final String title;
  final String message;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.home_work_outlined,
              size: 48,
              color: theme.colorScheme.onSurfaceVariant,
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            if (action != null) ...[
              const SizedBox(height: 12),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.cloud_off_outlined,
              size: 48,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            const SizedBox(height: 16),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 12),
            OutlinedButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}
