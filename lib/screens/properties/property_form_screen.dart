import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/constants.dart';
import '../../models/property.dart';
import '../../services/property_repository.dart';

/// Create or edit a property listing.
class PropertyFormScreen extends StatefulWidget {
  const PropertyFormScreen({
    super.key,
    required this.repository,
    this.property,
  });

  final PropertyRepository repository;
  final Property? property;

  @override
  State<PropertyFormScreen> createState() => _PropertyFormScreenState();
}

class _PropertyFormScreenState extends State<PropertyFormScreen> {
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _customBedroomsController = TextEditingController();
  final _areaController = TextEditingController();
  final _priceController = TextEditingController();
  final _locationController = TextEditingController();
  final _ownerNameController = TextEditingController();
  final _ownerPhoneController = TextEditingController();
  final _ownerConditionController = TextEditingController();

  late String _purpose = PropertyPurpose.rent;
  late String _type = PropertyType.values.first;
  late String _bedrooms = Bedrooms.values.first;
  late String _areaUnit = AreaUnit.values.first;
  late String _priceUnit = PropertyPurpose.priceUnitsFor(PropertyPurpose.rent).first;
  late String _status = PropertyStatus.available;

  bool _busy = false;

  bool get _isEditing => widget.property != null;

  bool get _isCustomBedrooms => _bedrooms == Bedrooms.custom;

  @override
  void initState() {
    super.initState();
    final property = widget.property;
    if (property == null) return;

    _nameController.text = property.name;
    _customBedroomsController.text = property.customBedrooms;
    _areaController.text =
        property.area == 0 ? '' : property.area.toStringAsFixed(0);
    _priceController.text =
        property.price == 0 ? '' : property.price.toStringAsFixed(0);
    _locationController.text = property.location;
    _ownerNameController.text = property.ownerName;
    _ownerPhoneController.text = property.ownerPhone;
    _ownerConditionController.text = property.ownerCondition;

    _purpose = property.purpose.isEmpty ? PropertyPurpose.rent : property.purpose;
    _type = property.type.isEmpty ? PropertyType.values.first : property.type;
    _bedrooms = property.bedrooms.isEmpty ? Bedrooms.values.first : property.bedrooms;
    _areaUnit =
        property.areaUnit.isEmpty ? AreaUnit.values.first : property.areaUnit;
    final priceUnits = PropertyPurpose.priceUnitsFor(_purpose);
    _priceUnit = priceUnits.contains(property.priceUnit)
        ? property.priceUnit
        : priceUnits.first;
    _status = property.status.isEmpty
        ? PropertyStatus.available
        : property.status;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _customBedroomsController.dispose();
    _areaController.dispose();
    _priceController.dispose();
    _locationController.dispose();
    _ownerNameController.dispose();
    _ownerPhoneController.dispose();
    _ownerConditionController.dispose();
    super.dispose();
  }

  void _onPurposeChanged(String purpose) {
    final units = PropertyPurpose.priceUnitsFor(purpose);
    setState(() {
      _purpose = purpose;
      if (!units.contains(_priceUnit)) _priceUnit = units.first;
    });
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    FocusScope.of(context).unfocus();
    setState(() => _busy = true);

    final property = Property(
      id: widget.property?.id,
      name: _nameController.text.trim(),
      purpose: _purpose,
      type: _type,
      bedrooms: _bedrooms,
      customBedrooms: _isCustomBedrooms
          ? _customBedroomsController.text.trim()
          : '',
      area: double.tryParse(_areaController.text.trim()) ?? 0,
      areaUnit: _areaUnit,
      price: double.tryParse(_priceController.text.trim()) ?? 0,
      priceUnit: _priceUnit,
      location: _locationController.text.trim(),
      status: _status,
      ownerName: _ownerNameController.text.trim(),
      ownerPhone: _ownerPhoneController.text.trim(),
      ownerCondition: _ownerConditionController.text.trim(),
    );

    try {
      await widget.repository.save(property);
      if (!mounted) return;
      final messenger = ScaffoldMessenger.of(context);
      Navigator.of(context).pop();
      messenger.showSnackBar(
        SnackBar(
          content: Text(_isEditing ? 'Property updated' : 'Property added'),
        ),
      );
    } catch (_) {
      if (!mounted) return;
      setState(() => _busy = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not save the property')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit property' : 'New property'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
          children: [
            _SectionLabel('Basics'),
            TextFormField(
              controller: _nameController,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(
                labelText: 'Property name',
                prefixIcon: Icon(Icons.home_work_outlined),
              ),
              validator: (value) => (value?.trim().isEmpty ?? true)
                  ? 'Enter the property name'
                  : null,
            ),
            const SizedBox(height: 16),
            Text(
              'Purpose',
              style: theme.textTheme.labelLarge?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: PropertyPurpose.rent, label: Text('Rent')),
                ButtonSegment(value: PropertyPurpose.sell, label: Text('Sell')),
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
                    controller: _areaController,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
                    ],
                    decoration: const InputDecoration(
                      labelText: 'Area',
                      prefixIcon: Icon(Icons.square_foot),
                    ),
                    validator: (value) {
                      final parsed = double.tryParse(value?.trim() ?? '');
                      if (parsed == null || parsed <= 0) {
                        return 'Enter the area';
                      }
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: DropdownButtonFormField<String>(
                    initialValue: _areaUnit,
                    isExpanded: true,
                    decoration: const InputDecoration(labelText: 'Unit'),
                    items: AreaUnit.values
                        .map(
                          (value) =>
                              DropdownMenuItem(value: value, child: Text(value)),
                        )
                        .toList(),
                    onChanged: (value) =>
                        setState(() => _areaUnit = value ?? _areaUnit),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  flex: 3,
                  child: TextFormField(
                    controller: _priceController,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
                    ],
                    decoration: const InputDecoration(
                      labelText: 'Price (PKR)',
                      prefixIcon: Icon(Icons.payments_outlined),
                    ),
                    validator: (value) {
                      final parsed = double.tryParse(value?.trim() ?? '');
                      if (parsed == null || parsed <= 0) {
                        return 'Enter the price';
                      }
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: DropdownButtonFormField<String>(
                    key: ValueKey(_priceUnit),
                    initialValue: _priceUnit,
                    isExpanded: true,
                    decoration: const InputDecoration(labelText: 'Unit'),
                    items: PropertyPurpose.priceUnitsFor(_purpose)
                        .map(
                          (value) =>
                              DropdownMenuItem(value: value, child: Text(value)),
                        )
                        .toList(),
                    onChanged: (value) =>
                        setState(() => _priceUnit = value ?? _priceUnit),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _locationController,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(
                labelText: 'Location',
                prefixIcon: Icon(Icons.location_on_outlined),
              ),
              validator: (value) => (value?.trim().isEmpty ?? true)
                  ? 'Enter the location'
                  : null,
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _status,
              isExpanded: true,
              decoration: const InputDecoration(
                labelText: 'Status',
                prefixIcon: Icon(Icons.flag_outlined),
              ),
              items: PropertyStatus.values
                  .map((value) => DropdownMenuItem(value: value, child: Text(value)))
                  .toList(),
              onChanged: (value) => setState(() => _status = value ?? _status),
            ),
            const SizedBox(height: 24),
            _SectionLabel('Owner'),
            TextFormField(
              controller: _ownerNameController,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(
                labelText: 'Owner name',
                prefixIcon: Icon(Icons.person_outline),
              ),
              validator: (value) => (value?.trim().isEmpty ?? true)
                  ? 'Enter the owner name'
                  : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _ownerPhoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Owner phone',
                prefixIcon: Icon(Icons.phone_outlined),
              ),
              validator: (value) {
                final phone = value?.trim() ?? '';
                if (phone.isEmpty) return null;
                final digits = phone.replaceAll(RegExp(r'[^\d]'), '');
                if (digits.length < 7) return 'Enter a valid phone number';
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _ownerConditionController,
              maxLines: 3,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                labelText: 'Owner conditions',
                hintText: 'e.g. Tenant must have references',
                alignLabelWithHint: true,
              ),
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
                  : Text(_isEditing ? 'Save changes' : 'Save property'),
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
