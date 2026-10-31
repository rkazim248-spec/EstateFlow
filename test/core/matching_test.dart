import 'package:estateflow/core/constants.dart';
import 'package:estateflow/core/matching.dart';
import 'package:estateflow/models/client.dart';
import 'package:estateflow/models/property.dart';
import 'package:flutter_test/flutter_test.dart';

Property buildProperty({
  String id = 'p1',
  String purpose = PropertyPurpose.rent,
  String type = 'Apartment',
  String bedrooms = '3 Bed D/D',
  double price = 50000,
  String priceUnit = 'Thousand Per Month',
  String status = PropertyStatus.available,
}) {
  return Property(
    id: id,
    name: 'Garden View Apartments',
    purpose: purpose,
    type: type,
    bedrooms: bedrooms,
    area: 1200,
    areaUnit: 'Sqft',
    price: price,
    priceUnit: priceUnit,
    location: 'Karachi',
    status: status,
    ownerName: 'Ali Khan',
    ownerPhone: '+923001234567',
  );
}

Client buildClient({
  String id = 'c1',
  String purpose = ClientPurpose.rent,
  String type = 'Apartment',
  String bedrooms = '3 Bed D/D',
  double budget = 60000,
  String budgetUnit = 'Thousand Per Month',
  String status = ClientStatus.newLead,
}) {
  return Client(
    id: id,
    name: 'Bilal Ahmed',
    phone: '+923111111111',
    purpose: purpose,
    type: type,
    bedrooms: bedrooms,
    budget: budget,
    budgetUnit: budgetUnit,
    location: 'Karachi',
    status: status,
  );
}

void main() {
  group('toPkr', () {
    test('converts each money unit to PKR', () {
      expect(toPkr(50, 'Lakh'), 5000000);
      expect(toPkr(1.5, 'Crore'), 15000000);
      expect(toPkr(50, 'Thousand Per Month'), 50000);
      expect(toPkr(2, 'Lakh Per Month'), 200000);
    });

    test('leaves unknown units untouched', () {
      expect(toPkr(42, 'Something Else'), 42);
    });
  });

  group('budgetCovers', () {
    test('compares across different units', () {
      final client = buildClient(budget: 2, budgetUnit: 'Crore');
      final property = buildProperty(
        purpose: PropertyPurpose.sell,
        price: 150,
        priceUnit: 'Lakh',
      );
      expect(budgetCovers(client, property), isTrue);
    });

    test('rejects a budget below the price', () {
      final client = buildClient(budget: 10, budgetUnit: 'Lakh');
      final property = buildProperty(
        purpose: PropertyPurpose.sell,
        price: 25,
        priceUnit: 'Lakh',
      );
      expect(budgetCovers(client, property), isFalse);
    });
  });

  group('bedroomsMatch', () {
    test('matches identical presets', () {
      expect(
        bedroomsMatch(buildClient(), buildProperty()),
        isTrue,
      );
    });

    test('rejects different bedroom counts', () {
      expect(
        bedroomsMatch(
          buildClient(bedrooms: '2 Bed D/D'),
          buildProperty(bedrooms: '4 Bed D/D'),
        ),
        isFalse,
      );
    });

    test('treats a custom requirement as a wildcard', () {
      expect(
        bedroomsMatch(
          buildClient(bedrooms: Bedrooms.custom),
          buildProperty(bedrooms: '4 Bed D/D'),
        ),
        isTrue,
      );
    });
  });

  group('matchClientsForProperty', () {
    test('finds clients that satisfy type, purpose and budget', () {
      final matches = matchClientsForProperty(
        buildProperty(),
        [buildClient(), buildClient(id: 'c2', type: 'House')],
      );
      expect(matches.map((c) => c.id), ['c1']);
    });

    test('excludes clients with the wrong purpose', () {
      final matches = matchClientsForProperty(
        buildProperty(),
        [buildClient(purpose: ClientPurpose.buy)],
      );
      expect(matches, isEmpty);
    });

    test('excludes clients whose budget is too small', () {
      final matches = matchClientsForProperty(
        buildProperty(),
        [buildClient(budget: 10)],
      );
      expect(matches, isEmpty);
    });
  });

  group('matchPropertiesForClient', () {
    test('finds properties that satisfy the client criteria', () {
      final matches = matchPropertiesForClient(
        buildClient(),
        [buildProperty(), buildProperty(id: 'p2', type: 'House')],
      );
      expect(matches.map((p) => p.id), ['p1']);
    });

    test('matches a sale property against a buying client', () {
      final matches = matchPropertiesForClient(
        buildClient(purpose: ClientPurpose.buy),
        [
          buildProperty(
            purpose: PropertyPurpose.sell,
            price: 120,
            priceUnit: 'Lakh',
          ),
        ],
      );
      expect(matches, hasLength(1));
    });
  });

  group('price units follow the purpose', () {
    test('sale uses Lakh and Crore', () {
      expect(
        PropertyPurpose.priceUnitsFor(PropertyPurpose.sell),
        ['Lakh', 'Crore'],
      );
    });

    test('rent uses per-month units', () {
      expect(
        PropertyPurpose.priceUnitsFor(PropertyPurpose.rent),
        ['Thousand Per Month', 'Lakh Per Month'],
      );
    });

    test('budget units follow the client purpose', () {
      expect(ClientPurpose.budgetUnitsFor(ClientPurpose.buy), [
        'Lakh',
        'Crore',
      ]);
      expect(ClientPurpose.budgetUnitsFor(ClientPurpose.rent), [
        'Thousand Per Month',
        'Lakh Per Month',
      ]);
    });
  });
}
