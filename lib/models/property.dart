import 'package:cloud_firestore/cloud_firestore.dart';

/// Formats a number without trailing zeros, e.g. `1200` -> `1,200`.
String formatAmount(num value) {
  // Whole numbers print without decimals; fractions keep two decimal places
  // so an area of 12.5 Marla is never rounded up to 13.
  final isWhole = value == value.truncateToDouble();
  final digits = isWhole ? value.toStringAsFixed(0) : value.toStringAsFixed(2);
  final parts = digits.split('.');
  final buffer = StringBuffer();
  for (var i = 0; i < parts[0].length; i++) {
    final remaining = parts[0].length - i;
    buffer.write(parts[0][i]);
    if (remaining > 1 && remaining % 3 == 1) buffer.write(',');
  }
  if (parts.length > 1) buffer.write('.${parts[1]}');
  return buffer.toString();
}

/// A single real-estate listing stored in the `properties` collection.
class Property {
  const Property({
    this.id,
    required this.name,
    required this.purpose,
    required this.type,
    required this.bedrooms,
    this.customBedrooms = '',
    required this.area,
    required this.areaUnit,
    required this.price,
    required this.priceUnit,
    required this.location,
    required this.status,
    required this.ownerName,
    required this.ownerPhone,
    this.ownerCondition = '',
    this.ownerId,
  });

  final String? id;
  final String name;

  /// `Rent` or `Sell`.
  final String purpose;

  /// Apartment, House, Plot, Shop or Office.
  final String type;

  /// A preset such as `3 Bed D/D`, or `Custom`.
  final String bedrooms;

  /// Free-text bedroom count used when [bedrooms] is `Custom`.
  final String customBedrooms;

  final double area;
  final String areaUnit;
  final double price;
  final String priceUnit;
  final String location;

  /// Available, Sold, Rented or Not Available.
  final String status;
  final String ownerName;
  final String ownerPhone;
  final String ownerCondition;
  final String? ownerId;

  /// The bedroom description, resolving the `Custom` case.
  String get resolvedBedrooms =>
      bedrooms == 'Custom' && customBedrooms.trim().isNotEmpty
          ? customBedrooms.trim()
          : bedrooms;

  String get priceLabel => 'PKR ${formatAmount(price)} $priceUnit';

  String get areaLabel => '${formatAmount(area)} $areaUnit';

  bool get isForRent => purpose == 'Rent';

  bool get isForSale => purpose == 'Sell';

  /// True when the listing can still be matched against a client.
  bool get isActive => status == 'Available';

  /// Builds a listing from raw Supabase fields.
  factory Property.fromDocument(DocumentSnapshot<Map<String, dynamic>> doc) {
    return Property.fromMap(doc.id, doc.data() ?? const {});
  }

  /// Builds a listing from raw Firestore fields.
  factory Property.fromMap(String id, Map<String, dynamic> data) {
    double asDouble(Object? value) => switch (value) {
          num n => n.toDouble(),
          String s => double.tryParse(s) ?? 0,
          _ => 0,
        };

    return Property(
      id: id,
      name: data['name'] as String? ?? '',
      purpose: data['purpose'] as String? ?? '',
      type: data['type'] as String? ?? '',
      bedrooms: data['bedrooms'] as String? ?? '',
      customBedrooms: data['customBedrooms'] as String? ?? '',
      area: asDouble(data['area']),
      areaUnit: data['areaUnit'] as String? ?? '',
      price: asDouble(data['price']),
      priceUnit: data['priceUnit'] as String? ?? '',
      location: data['location'] as String? ?? '',
      status: data['status'] as String? ?? '',
      ownerName: data['ownerName'] as String? ?? '',
      ownerPhone: data['ownerPhone'] as String? ?? '',
      ownerCondition: data['ownerCondition'] as String? ?? '',
      ownerId: data['ownerId'] as String?,
    );
  }

  Map<String, dynamic> toMap() => {
        'name': name,
        'purpose': purpose,
        'type': type,
        'bedrooms': bedrooms,
        'customBedrooms': customBedrooms,
        'area': area,
        'areaUnit': areaUnit,
        'price': price,
        'priceUnit': priceUnit,
        'location': location,
        'status': status,
        'ownerName': ownerName,
        'ownerPhone': ownerPhone,
        'ownerCondition': ownerCondition,
        'ownerId': ownerId,
      };

  Property copyWith({
    String? id,
    String? name,
    String? purpose,
    String? type,
    String? bedrooms,
    String? customBedrooms,
    double? area,
    String? areaUnit,
    double? price,
    String? priceUnit,
    String? location,
    String? status,
    String? ownerName,
    String? ownerPhone,
    String? ownerCondition,
  }) {
    return Property(
      id: id ?? this.id,
      name: name ?? this.name,
      purpose: purpose ?? this.purpose,
      type: type ?? this.type,
      bedrooms: bedrooms ?? this.bedrooms,
      customBedrooms: customBedrooms ?? this.customBedrooms,
      area: area ?? this.area,
      areaUnit: areaUnit ?? this.areaUnit,
      price: price ?? this.price,
      priceUnit: priceUnit ?? this.priceUnit,
      location: location ?? this.location,
      status: status ?? this.status,
      ownerName: ownerName ?? this.ownerName,
      ownerPhone: ownerPhone ?? this.ownerPhone,
      ownerCondition: ownerCondition ?? this.ownerCondition,
    );
  }
}
