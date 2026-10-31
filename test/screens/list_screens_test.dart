import 'package:estateflow/core/constants.dart';
import 'package:estateflow/models/client.dart';
import 'package:estateflow/models/property.dart';
import 'package:estateflow/screens/clients/client_list_screen.dart';
import 'package:estateflow/screens/properties/property_list_screen.dart';
import 'package:estateflow/services/client_repository.dart';
import 'package:estateflow/services/property_repository.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// A property repository that serves a fixed list.
class FakePropertyRepository extends PropertyRepository {
  FakePropertyRepository(this.items);

  final List<Property> items;

  @override
  Stream<List<Property>> watchAll() => Stream.value(items);
}

/// A client repository that serves a fixed list.
class FakeClientRepository extends ClientRepository {
  FakeClientRepository(this.items);

  final List<Client> items;

  @override
  Stream<List<Client>> watchAll() => Stream.value(items);
}

Property sampleProperty() => Property(
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
);

Client sampleClient() => Client(
  id: 'c1',
  name: 'Bilal Ahmed',
  phone: '+923111111111',
  purpose: ClientPurpose.buy,
  type: 'House',
  bedrooms: '4 Bed D/D',
  budget: 250,
  budgetUnit: 'Lakh',
  location: 'Islamabad',
  status: ClientStatus.contacted,
);

void main() {
  group('PropertyListScreen', () {
    testWidgets('shows a card with the listing details and actions', (
      tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: PropertyListScreen(
            repository: FakePropertyRepository([sampleProperty()]),
            clientRepository: FakeClientRepository([]),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Garden View Apartments'), findsOneWidget);
      expect(find.text('PKR 50,000 Thousand Per Month'), findsOneWidget);
      expect(find.text('Available'), findsOneWidget);
      expect(find.text('View'), findsOneWidget);
      expect(find.text('Edit'), findsOneWidget);
      expect(find.text('Match'), findsOneWidget);
    });

    testWidgets('filters by the search query', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: PropertyListScreen(
            repository: FakePropertyRepository([
              sampleProperty(),
              Property(
                id: 'p2',
                name: 'Sea Breeze Villa',
                purpose: PropertyPurpose.sell,
                type: 'House',
                bedrooms: '5 Bed D/D',
                area: 2,
                areaUnit: 'Kanal',
                price: 300,
                priceUnit: 'Lakh',
                location: 'Karachi',
                status: PropertyStatus.sold,
                ownerName: 'Sara Khan',
                ownerPhone: '+923222222222',
              ),
            ]),
            clientRepository: FakeClientRepository([]),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Garden View Apartments'), findsOneWidget);
      expect(find.text('Sea Breeze Villa'), findsOneWidget);

      await tester.enterText(find.byType(TextField).first, 'Sea');
      await tester.pumpAndSettle();

      expect(find.text('Garden View Apartments'), findsNothing);
      expect(find.text('Sea Breeze Villa'), findsOneWidget);
    });

    testWidgets('does not overflow on a small screen', (tester) async {
      tester.view.physicalSize = const Size(320, 700);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.reset);

      await tester.pumpWidget(
        MaterialApp(
          home: PropertyListScreen(
            repository: FakePropertyRepository([sampleProperty()]),
            clientRepository: FakeClientRepository([]),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
    });
  });

  group('ClientListScreen', () {
    testWidgets('shows a card with the client details and actions', (
      tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ClientListScreen(
            repository: FakeClientRepository([sampleClient()]),
            propertyRepository: FakePropertyRepository([]),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Bilal Ahmed'), findsOneWidget);
      expect(find.text('PKR 250 Lakh'), findsOneWidget);
      expect(find.text('Contacted'), findsOneWidget);
      expect(find.text('View'), findsOneWidget);
      expect(find.text('Edit'), findsOneWidget);
      expect(find.text('Match'), findsOneWidget);
    });

    testWidgets('does not overflow on a small screen', (tester) async {
      tester.view.physicalSize = const Size(320, 700);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.reset);

      await tester.pumpWidget(
        MaterialApp(
          home: ClientListScreen(
            repository: FakeClientRepository([sampleClient()]),
            propertyRepository: FakePropertyRepository([]),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
    });
  });
}
