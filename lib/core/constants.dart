/// Shared option lists and display helpers used across EstateFlow forms.
///
/// The values are stored verbatim in Supabase, so they double as the
/// canonical schema for the `properties` and `clients` tables.
library;

import 'package:flutter/material.dart' show Color;

/// Property purpose: whether the listing is offered for rent or for sale.
class PropertyPurpose {
  static const String rent = 'Rent';
  static const String sell = 'Sell';

  static const List<String> values = [rent, sell];

  /// Price units available for a given purpose.
  static List<String> priceUnitsFor(String purpose) => switch (purpose) {
        sell => const ['Lakh', 'Crore'],
        _ => const ['Thousand Per Month', 'Lakh Per Month'],
      };
}

/// The kind of property being listed.
class PropertyType {
  static const List<String> values = [
    'Apartment',
    'House',
    'Plot',
    'Shop',
    'Office',
  ];
}

/// Availability state of a listing.
class PropertyStatus {
  static const String available = 'Available';
  static const String sold = 'Sold';
  static const String rented = 'Rented';
  static const String notAvailable = 'Not Available';

  static const List<String> values = [
    available,
    sold,
    rented,
    notAvailable,
  ];
}

/// Bedroom presets. [custom] reveals an extra free-text field.
class Bedrooms {
  static const String custom = 'Custom';

  static const List<String> values = [
    '2 Bed D/D',
    '3 Bed D/D',
    '4 Bed D/D',
    '5 Bed D/D',
    custom,
  ];
}

/// Area units understood by the app.
class AreaUnit {
  static const List<String> values = [
    'Marla',
    'Kanal',
    'Sqft',
    'Sqyd',
    'Acre',
  ];
}

/// Whether a client intends to buy or to rent.
class ClientPurpose {
  static const String buy = 'Want to Buy';
  static const String rent = 'Want to Rent';

  static const List<String> values = [buy, rent];

  /// Budget units available for a given purpose.
  static List<String> budgetUnitsFor(String purpose) => switch (purpose) {
        buy => const ['Lakh', 'Crore'],
        _ => const ['Thousand Per Month', 'Lakh Per Month'],
      };
}

/// Follow-up state of a client.
class ClientStatus {
  static const String newLead = 'New';
  static const String contacted = 'Contacted';
  static const String negotiating = 'Negotiating';
  static const String closed = 'Closed';
  static const String lost = 'Lost';

  static const List<String> values = [
    newLead,
    contacted,
    negotiating,
    closed,
    lost,
  ];
}

/// OAuth client ids for the Supabase project.
class GoogleOAuth {
  const GoogleOAuth._();

  /// The web OAuth client.
  ///
  /// Android reads the matching id from `google-services.json` and iOS from
  /// `GoogleService-Info.plist`, so this is only needed on the web, where the
  /// Google Identity Services SDK has to be told which client to use.
  static const String webClientId =
      '353372777164-q0v4tqjq4nag94cnnn9f4sp6mugnuav5.apps.googleusercontent.com';
}

/// Firestore collection names.
class Collections {
  static const String properties = 'properties';
  static const String clients = 'clients';
}

/// Accent seeds offered in Settings. The index is persisted so the user can
/// pick a Material 3 seed colour.
class AccentColors {
  static const List<Color> seeds = [
    Color(0xFF00696D),
    Color(0xFF3F5BA9),
    Color(0xFF6D43C4),
    Color(0xFF00696E),
    Color(0xFF8F4C38),
    Color(0xFF2E6B33),
  ];

  static const List<String> names = [
    'Teal',
    'Indigo',
    'Violet',
    'Cyan',
    'Terracotta',
    'Forest',
  ];
}
