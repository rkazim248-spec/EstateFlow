import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/constants.dart';
import '../../models/client.dart';
import '../../services/client_repository.dart';

/// Create or edit a client record.
class ClientFormScreen extends StatefulWidget {
  const ClientFormScreen({
    super.key,
    required this.repository,
    this.client,
  });

  final ClientRepository repository;
  final Client? client;

  @override
  State<ClientFormScreen> createState() => _ClientFormScreenState();
}

class _ClientFormScreenState extends State<ClientFormScreen> {
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _customBedroomsController = TextEditingController();
  final _budgetController = TextEditingController();
  final _locationController = TextEditingController();
  final _requirementsController = TextEditingController();
  final _conditionController = TextEditingController();

  late String _purpose = ClientPurpose.buy;
  late String _type = PropertyType.values.first;
  late String _bedrooms = Bedrooms.values.first;
  late String _budgetUnit = ClientPurpose.budgetUnitsFor(ClientPurpose.buy).first;
  late String _status = ClientStatus.newLead;

  bool _busy = false;

  bool get _isEditing => widget.client != null;

  bool get _isCustomBedrooms => _bedrooms == Bedrooms.custom;

  @override
  void initState() {
    super.initState();
    final client = widget.client;
    if (client == null) return;

    _nameController.text = client.name;
    _phoneController.text = client.phone;
    _customBedroomsController.text = client.customBedrooms;
    _budgetController.text =
        client.budget == 0 ? '' : client.budget.toStringAsFixed(0);
    _locationController.text = client.location;
    _requirementsController.text = client.requirements;
    _conditionController.text = client.condition;

    _purpose = client.purpose.isEmpty ? ClientPurpose.buy : client.purpose;
    _type = client.type.isEmpty ? PropertyType.values.first : client.type;
    _bedrooms = client.bedrooms.isEmpty ? Bedrooms.values.first : client.bedrooms;
    final units = ClientPurpose.budgetUnitsFor(_purpose);
    _budgetUnit =
        units.contains(client.budgetUnit) ? client.budgetUnit : units.first;
    _status = client.status.isEmpty ? ClientStatus.newLead : client.status;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _customBedroomsController.dispose();
    _budgetController.dispose();
    _locationController.dispose();
    _requirementsController.dispose();
    _conditionController.dispose();
    super.dispose();
  }

  void _onPurposeChanged(String purpose) {
    final units = ClientPurpose.budgetUnitsFor(purpose);
    setState(() {
      _purpose = purpose;
      if (!units.contains(_budgetUnit)) _budgetUnit = units.first;
    });
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    setState(() => _busy = true);

    final client = Client(
      id: widget.client?.id,
      name: _nameController.text.trim(),
      phone: _phoneController.text.trim(),
      purpose: _purpose,
      type: _type,
      bedrooms: _bedrooms,
      customBedrooms: _isCustomBedrooms
          ? _customBedroomsController.text.trim()
          : '',
      budget: double.tryParse(_budgetController.text.trim()) ?? 0,
      budgetUnit: _budgetUnit,
      location: _locationController.text.trim(),
      requirements: _requirementsController.text.trim(),
      condition: _conditionController.text.trim(),
      status: _status,
    );

    try {
      await widget.repository.save(client);
      if (!mounted) return;
      final messenger = ScaffoldMessenger.of(context);
      Navigator.of(context).pop();
      messenger.showSnackBar(
        SnackBar(content: Text(_isEditing ? 'Client updated' : 'Client added')),
      );
    } catch (_) {
      if (!mounted) return;
      setState(() => _busy = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not save the client')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit client' : 'New client'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          children: [
            _SectionLabel('Contact'),
            TextFormField(
              controller: _nameController,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(
                labelText: 'Client name',
                prefixIcon: Icon(Icons.person_outline),
              ),
              validator: (value) => (value?.trim().isEmpty ?? true)
                  ? 'Enter the client name'
                  : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Phone number',
                prefixIcon: Icon(Icons.phone_outlined),
              ),
              validator: (value) {
                final phone = value?.trim() ?? '';
                if (phone.isEmpty) return 'Enter a phone number';
                final digits = phone.replaceAll(RegExp(r'[^\d]'), '');
                if (digits.length < 7) return 'Enter a valid phone number';
                return null;
              },
            ),
            const SizedBox(height: 24),
            _SectionLabel('Preferences'),
            Text(
              'Purpose',
              style: theme.textTheme.labelLarge?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: ClientPurpose.buy, label: Text('Buy')),
                ButtonSegment(value: ClientPurpose.rent, label: Text('Rent')),
              ],
              selected: {_purpose},
              onSelectionChanged: (selection) =>
                  _onPurposeChanged(selection.first),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _type,
              isExpanded: true,
              decoration: const InputDecoration(
                labelText: 'Property type',
                prefixIcon: Icon(Icons.category_outlined),
              ),
              items: PropertyType.values
                  .map((value) => DropdownMenuItem(value: value, child: Text(value)))
                  .toList(),
              onChanged: (value) => setState(() => _type = value ?? _type),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _bedrooms,
              isExpanded: true,
              decoration: const InputDecoration(
                labelText: 'Bedrooms',
                prefixIcon: Icon(Icons.bed_outlined),
              ),
              items: Bedrooms.values
                  .map((value) => DropdownMenuItem(value: value, child: Text(value)))
                  .toList(),
              onChanged: (value) => setState(() => _bedrooms = value ?? _bedrooms),
            ),
            AnimatedSize(
              duration: const Duration(milliseconds: 220),
              curve: Curves.easeOut,
              child: _isCustomBedrooms
                  ? Padding(
                      key: const ValueKey('custom-bedrooms'),
                      padding: const EdgeInsets.only(top: 16),
                      child: TextFormField(
                        controller: _customBedroomsController,
                        decoration: const InputDecoration(
                          labelText: 'Custom bedroom details',
                          hintText: 'e.g. 6 Bed D/D with 3 attached baths',
                          prefixIcon: Icon(Icons.bedroom_parent_outlined),
                        ),
                        validator: (value) {
                          if (!_isCustomBedrooms) return null;
                          return (value?.trim().isEmpty ?? true)
                              ? 'Describe the bedrooms'
                              : null;
                        },
                      ),
                    )
                  : const SizedBox.shrink(),
            ),
            const SizedBox(height: 16),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  flex: 3,
                  child: TextFormField(
                    controller: _budgetController,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
                    ],
                    decoration: const InputDecoration(
                      labelText: 'Budget (PKR)',
                      prefixIcon: Icon(Icons.payments_outlined),
                    ),
                    validator: (value) {
                      final parsed = double.tryParse(value?.trim() ?? '');
                      if (parsed == null || parsed <= 0) {
                        return 'Enter the budget';
                      }
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: DropdownButtonFormField<String>(
                    key: ValueKey(_budgetUnit),
                    initialValue: _budgetUnit,
                    isExpanded: true,
                    decoration: const InputDecoration(labelText: 'Unit'),
                    items: ClientPurpose.budgetUnitsFor(_purpose)
                        .map(
                          (value) =>
                              DropdownMenuItem(value: value, child: Text(value)),
                        )
                        .toList(),
                    onChanged: (value) =>
                        setState(() => _budgetUnit = value ?? _budgetUnit),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _locationController,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(
                labelText: 'Preferred location',
                prefixIcon: Icon(Icons.location_on_outlined),
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _requirementsController,
              maxLines: 3,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                labelText: 'Client requirements',
                hintText: 'e.g. Near school, corner plot, parking',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _conditionController,
              maxLines: 3,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                labelText: 'Client condition / notes',
                hintText: 'e.g. Only cash, must be settled by December',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _status,
              isExpanded: true,
              decoration: const InputDecoration(
                labelText: 'Status',
                prefixIcon: Icon(Icons.flag_outlined),
              ),
              items: ClientStatus.values
                  .map((value) => DropdownMenuItem(value: value, child: Text(value)))
                  .toList(),
              onChanged: (value) => setState(() => _status = value ?? _status),
            ),
            const SizedBox(height: 28),
            FilledButton(
              onPressed: _busy ? null : _save,
              child: _busy
                  ? const SizedBox(
                      height: 22,
                      width: 22,
                      child: CircularProgressIndicator(strokeWidth: 2.4),
                    )
                  : Text(_isEditing ? 'Save changes' : 'Save client'),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: _busy ? null : () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, top: 4),
      child: Text(
        text,
        style: theme.textTheme.titleSmall?.copyWith(
          fontWeight: FontWeight.w700,
          color: theme.colorScheme.primary,
        ),
      ),
    );
  }
}
