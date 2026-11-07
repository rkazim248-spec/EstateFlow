import 'package:estateflow/core/constants.dart';
import 'package:estateflow/models/client.dart';
import 'package:estateflow/models/property.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('formatAmount', () {
    test('groups thousands', () {
      expect(formatAmount(1200), '1,200');
      expect(formatAmount(1234567), '1,234,567');
    });

    test('leaves small numbers alone', () {
      expect(formatAmount(42), '42');
      expect(formatAmount(0), '0');
    });

    test('keeps two decimals for fractional values', () {
      expect(formatAmount(12.5), '12.50');
    });
  });

  group('Property', () {
    test('round-trips through a Firestore document', () {
      final original = Property(
        id: 'p1',
        name: 'Garden View Apartments',
        purpose: PropertyPurpose.rent,
        type: 'Apartment',
        bedrooms: '3 Bed D/D',
        area: 1200,
        areaUnit: 'Sqft',
        price: 50000,
        priceUnit: 'Thousand Per Month',
        location: 'Karachi',
        status: PropertyStatus.available,
        ownerName: 'Ali Khan',
        ownerPhone: '+923001234567',
        ownerCondition: 'Tenant must have references',
      );

      final restored = Property.fromMap('p1', original.toMap());

      expect(restored.id, 'p1');
      expect(restored.name, original.name);
      expect(restored.purpose, PropertyPurpose.rent);
      expect(restored.area, 1200);
      expect(restored.price, 50000);
      expect(restored.ownerCondition, 'Tenant must have references');
    });

    test('uses the documented field names', () {
      final property = Property(
        name: 'n',
        purpose: PropertyPurpose.sell,
        type: 'Plot',
        bedrooms: '2 Bed D/D',
        area: 1,
        areaUnit: 'Marla',
        price: 2,
        priceUnit: 'Lakh',
        location: 'Lahore',
        status: PropertyStatus.available,
        ownerName: 'o',
        ownerPhone: 'p',
      );

      expect(
        property.toMap().keys,
        containsAll([
          'name',
          'purpose',
          'type',
          'bedrooms',
          'custom_bedrooms',
          'area',
          'area_unit',
          'price',
          'price_unit',
          'location',
          'status',
          'owner_name',
          'owner_phone',
          'owner_condition',
          'owner_id',
          'normalized_price',
        ]),
      );
    });

    test('resolves the custom bedroom description', () {
      final property = Property(
        name: 'n',
        purpose: PropertyPurpose.rent,
        type: 'House',
        bedrooms: Bedrooms.custom,
        customBedrooms: '6 Bed D/D',
        area: 1,
        areaUnit: 'Marla',
        price: 1,
        priceUnit: 'Lakh',
        location: 'Lahore',
        status: PropertyStatus.available,
        ownerName: 'o',
        ownerPhone: 'p',
      );

      expect(property.resolvedBedrooms, '6 Bed D/D');
    });

    test('builds readable price and area labels', () {
      final property = Property(
        name: 'n',
        purpose: PropertyPurpose.rent,
        type: 'House',
        bedrooms: '3 Bed D/D',
        area: 1200,
        areaUnit: 'Sqft',
        price: 50000,
        priceUnit: 'Thousand Per Month',
        location: 'Lahore',
        status: PropertyStatus.available,
        ownerName: 'o',
        ownerPhone: 'p',
      );

      expect(property.priceLabel, 'PKR 50,000 Thousand Per Month');
      expect(property.areaLabel, '1,200 Sqft');
      expect(property.isForRent, isTrue);
      expect(property.isForSale, isFalse);
      expect(property.isActive, isTrue);
    });

    test('reads numbers stored as strings', () {
      final property = Property.fromMap('p1', {
        'name': 'n',
        'purpose': PropertyPurpose.rent,
        'type': 'House',
        'bedrooms': '3 Bed D/D',
        'area': '1200',
        'areaUnit': 'Sqft',
        'price': '50000',
        'priceUnit': 'Lakh',
        'location': 'Lahore',
        'status': PropertyStatus.available,
        'ownerName': 'o',
        'ownerPhone': 'p',
      });

      expect(property.area, 1200);
      expect(property.price, 50000);
    });
  });

  group('Client', () {
    test('round-trips through a Firestore document', () {
      final original = Client(
        id: 'c1',
        name: 'Bilal Ahmed',
        phone: '+923111111111',
        purpose: ClientPurpose.buy,
        type: 'House',
        bedrooms: '4 Bed D/D',
        budget: 250,
        budgetUnit: 'Lakh',
        location: 'Islamabad',
        requirements: 'Near school',
        condition: 'Only cash',
        status: ClientStatus.negotiating,
      );

      final restored = Client.fromMap('c1', original.toMap());

      expect(restored.id, 'c1');
      expect(restored.name, 'Bilal Ahmed');
      expect(restored.purpose, ClientPurpose.buy);
      expect(restored.budget, 250);
      expect(restored.requirements, 'Near school');
      expect(restored.status, ClientStatus.negotiating);
    });

    test('exposes the intent and budget as helpers', () {
      final client = Client(
        name: 'n',
        phone: 'p',
        purpose: ClientPurpose.rent,
        type: 'Shop',
        bedrooms: '2 Bed D/D',
        budget: 150,
        budgetUnit: 'Thousand Per Month',
        location: 'Lahore',
        status: ClientStatus.newLead,
      );

      expect(client.wantsToRent, isTrue);
      expect(client.wantsToBuy, isFalse);
      expect(client.isOpen, isTrue);
      expect(client.budgetLabel, 'PKR 150 Thousand Per Month');
    });

    test('treats closed and lost leads as finished', () {
      Client clientWithStatus(String status) => Client(
            name: 'n',
            phone: 'p',
            purpose: ClientPurpose.buy,
            type: 'House',
            bedrooms: '3 Bed D/D',
            budget: 1,
            budgetUnit: 'Lakh',
            location: 'Lahore',
            status: status,
          );

      expect(clientWithStatus(ClientStatus.closed).isOpen, isFalse);
      expect(clientWithStatus(ClientStatus.lost).isOpen, isFalse);
      expect(clientWithStatus(ClientStatus.contacted).isOpen, isTrue);
    });
  });
}
