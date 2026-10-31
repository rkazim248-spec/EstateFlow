import 'package:estateflow/core/app_theme.dart';
import 'package:estateflow/core/constants.dart';
import 'package:estateflow/models/client.dart';
import 'package:estateflow/models/property.dart';
import 'package:estateflow/screens/dashboard/dashboard_screen.dart';
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

Property sampleProperty({String purpose = PropertyPurpose.rent}) => Property(
  id: 'p1',
  name: 'Garden View Apartments',
  purpose: purpose,
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

Client sampleClient({String purpose = ClientPurpose.buy}) => Client(
  id: 'c1',
  name: 'Bilal Ahmed',
  phone: '+923111111111',
  purpose: purpose,
  type: 'House',
  bedrooms: '4 Bed D/D',
  budget: 250,
  budgetUnit: 'Lakh',
  location: 'Islamabad',
  status: ClientStatus.contacted,
);

Widget harness({
  required List<Property> properties,
  required List<Client> clients,
}) {
  return MaterialApp(
    theme: AppTheme.light(Colors.teal),
    home: DashboardScreen(
      onOpenProperties: () {},
      onOpenClients: () {},
      propertyRepository: FakePropertyRepository(properties),
      clientRepository: FakeClientRepository(clients),
    ),
  );
}

void main() {
  testWidgets('renders the six dashboard metrics without overflowing', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(411, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(
      harness(
        properties: [
          sampleProperty(),
          sampleProperty(purpose: PropertyPurpose.sell),
        ],
        clients: [
          sampleClient(),
          sampleClient(purpose: ClientPurpose.rent),
        ],
      ),
    );
    await tester.pumpAndSettle();

    // No overflow was reported while laying out the grid.
    expect(tester.takeException(), isNull);

    expect(find.text('Total Properties'), findsOneWidget);
    expect(find.text('Properties for Rent'), findsOneWidget);
    expect(find.text('Properties for Sale'), findsOneWidget);
    expect(find.text('Total Clients'), findsOneWidget);
    expect(find.text('Clients Buying'), findsOneWidget);
    expect(find.text('Clients Renting'), findsOneWidget);

    expect(find.text('2'), findsNWidgets(2));
    expect(find.text('1'), findsNWidgets(4));
  });

  testWidgets('lays out on a small screen without overflowing', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(320, 640);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(harness(properties: [], clients: []));
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
  });
}
