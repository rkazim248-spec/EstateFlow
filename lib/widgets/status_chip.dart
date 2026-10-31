import 'package:flutter/material.dart';

/// Coloured status badge used on property and client cards.
class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final (background, foreground) = _palette(scheme);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: foreground,
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.2,
        ),
      ),
    );
  }

  (Color, Color) _palette(ColorScheme scheme) {
    switch (status) {
      case 'Available':
      case 'Closed':
        return (scheme.tertiaryContainer, scheme.onTertiaryContainer);
      case 'Sold':
      case 'New':
        return (scheme.primaryContainer, scheme.onPrimaryContainer);
      case 'Rented':
      case 'Contacted':
        return (scheme.secondaryContainer, scheme.onSecondaryContainer);
      case 'Negotiating':
        return (scheme.tertiaryContainer, scheme.onTertiaryContainer);
      case 'Not Available':
      case 'Lost':
        return (scheme.errorContainer, scheme.onErrorContainer);
      default:
        return (scheme.surfaceContainerHighest, scheme.onSurfaceVariant);
    }
  }
}
