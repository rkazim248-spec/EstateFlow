import 'package:cloud_firestore/cloud_firestore.dart';

import 'property.dart' show formatAmount;

/// A client record stored in the `clients` collection.
class Client {
  const Client({
    this.id,
    required this.name,
    required this.phone,
    required this.purpose,
    required this.type,
    required this.bedrooms,
    this.customBedrooms = '',
    required this.budget,
    required this.budgetUnit,
    required this.location,
    this.requirements = '',
    this.condition = '',
    required this.status,
    this.ownerId,
  });

  final String? id;
  final String name;
  final String phone;

  /// `Want to Buy` or `Want to Rent`.
  final String purpose;

  /// Apartment, House, Plot, Shop or Office.
  final String type;

  /// A preset such as `3 Bed D/D`, or `Custom`.
  final String bedrooms;

  /// Free-text bedroom count used when [bedrooms] is `Custom`.
  final String customBedrooms;

  final double budget;
  final String budgetUnit;
  final String location;
  final String requirements;
  final String condition;

  /// New, Contacted, Negotiating, Closed or Lost.
  final String status;

  /// The UID of the user who owns this client.
  final String? ownerId;

  String get resolvedBedrooms =>
      bedrooms == 'Custom' && customBedrooms.trim().isNotEmpty
          ? customBedrooms.trim()
          : bedrooms;

  String get budgetLabel => 'PKR ${formatAmount(budget)} $budgetUnit';

  bool get wantsToBuy => purpose == 'Want to Buy';

  bool get wantsToRent => purpose == 'Want to Rent';

  /// True when the client is still being worked.
  bool get isOpen => status != 'Closed' && status != 'Lost';

  factory Client.fromDocument(DocumentSnapshot<Map<String, dynamic>> doc) {
    return Client.fromMap(doc.id, doc.data() ?? const {});
  }

  /// Builds a client from raw Firestore fields.
  factory Client.fromMap(String id, Map<String, dynamic> data) {
    double asDouble(Object? value) => switch (value) {
          num n => n.toDouble(),
          String s => double.tryParse(s) ?? 0,
          _ => 0,
        };

    return Client(
      id: id,
      name: data['name'] as String? ?? '',
      phone: data['phone'] as String? ?? '',
      purpose: data['purpose'] as String? ?? '',
      type: data['type'] as String? ?? '',
      bedrooms: data['bedrooms'] as String? ?? '',
      customBedrooms: data['customBedrooms'] as String? ?? '',
      budget: asDouble(data['budget']),
      budgetUnit: data['budgetUnit'] as String? ?? '',
      location: data['location'] as String? ?? '',
      requirements: data['requirements'] as String? ?? '',
      condition: data['condition'] as String? ?? '',
      status: data['status'] as String? ?? '',
      ownerId: data['ownerId'] as String?,
    );
  }

  Map<String, dynamic> toMap() => {
        'name': name,
        'phone': phone,
        'purpose': purpose,
        'type': type,
        'bedrooms': bedrooms,
        'customBedrooms': customBedrooms,
        'budget': budget,
        'budgetUnit': budgetUnit,
        'location': location,
        'requirements': requirements,
        'condition': condition,
        'status': status,
        'ownerId': ownerId,
      };

  Client copyWith({
    String? id,
    String? name,
    String? phone,
    String? purpose,
    String? type,
    String? bedrooms,
    String? customBedrooms,
    double? budget,
    String? budgetUnit,
    String? location,
    String? requirements,
    String? condition,
    String? status,
  }) {
    return Client(
      id: id ?? this.id,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      purpose: purpose ?? this.purpose,
      type: type ?? this.type,
      bedrooms: bedrooms ?? this.bedrooms,
      customBedrooms: customBedrooms ?? this.customBedrooms,
      budget: budget ?? this.budget,
      budgetUnit: budgetUnit ?? this.budgetUnit,
      location: location ?? this.location,
      requirements: requirements ?? this.requirements,
      condition: condition ?? this.condition,
      status: status ?? this.status,
    );
  }
}
