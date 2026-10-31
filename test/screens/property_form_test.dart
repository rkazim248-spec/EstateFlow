import 'package:estateflow/core/constants.dart';
import 'package:estateflow/models/property.dart';
import 'package:estateflow/screens/properties/property_form_screen.dart';
import 'package:estateflow/services/property_repository.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// A repository that records saves instead of talking to Firestore.
class RecordingPropertyRepository extends PropertyRepository {
  RecordingPropertyRepository();

  final List<Property> saved = [];

  @override
  Future<void> save(Property property) async => saved.add(property);
}

/// Pumps the form on a narrow phone-sized surface that is tall enough to
/// build every field, so nothing needs to be scrolled during the test.
Future<void> pumpForm(
  WidgetTester tester,
  RecordingPropertyRepository repository,
) async {
  tester.view.physicalSize = const Size(400, 2400);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.reset);

  await tester.pumpWidget(
    MaterialApp(
      home: PropertyFormScreen(repository: repository),
    ),
  );
  await tester.pumpAndSettle();
}

/// Opens the dropdown at [index] and picks the option labelled [label].
Future<void> selectDropdown(
  WidgetTester tester,
  int index,
  String label,
) async {
  await tester.tap(find.byType(DropdownButtonFormField<String>).at(index));
  await tester.pumpAndSettle();
  await tester.tap(find.text(label).last);
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('shows the custom bedroom field only for the Custom option', (
    tester,
  ) async {
    await pumpForm(tester, RecordingPropertyRepository());

    expect(find.text('Custom bedroom details'), findsNothing);

    await selectDropdown(tester, 1, Bedrooms.custom);

    expect(find.text('Custom bedroom details'), findsOneWidget);
  });

  testWidgets('price units follow the selected purpose', (tester) async {
    await pumpForm(tester, RecordingPropertyRepository());

    // Rent is selected by default, so the per-month units are offered.
    expect(find.text('Thousand Per Month'), findsOneWidget);

    await tester.tap(find.text('Sell'));
    await tester.pumpAndSettle();

    // The sale units replace the rent ones.
    expect(find.text('Thousand Per Month'), findsNothing);
    expect(find.text('Lakh'), findsOneWidget);

    // Opening the unit dropdown lists both sale units.
    await selectDropdown(tester, 3, 'Crore');
    expect(find.text('Crore'), findsOneWidget);
  });

  testWidgets('blocks saving until the required fields are filled', (
    tester,
  ) async {
    final repository = RecordingPropertyRepository();
    await pumpForm(tester, repository);

    await tester.tap(find.text('Save property'));
    await tester.pumpAndSettle();

    expect(find.text('Enter the property name'), findsOneWidget);
    expect(find.text('Enter the area'), findsOneWidget);
    expect(find.text('Enter the price'), findsOneWidget);
    expect(find.text('Enter the location'), findsOneWidget);
    expect(find.text('Enter the owner name'), findsOneWidget);
    expect(repository.saved, isEmpty);
  });

  testWidgets('saves a new property with the entered values', (tester) async {
    final repository = RecordingPropertyRepository();
    await pumpForm(tester, repository);

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Property name'),
      'Garden View Apartments',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Area'),
      '1200',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Price (PKR)'),
      '50000',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Location'),
      'Karachi',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Owner name'),
      'Ali Khan',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Owner phone'),
      '+923001234567',
    );

    await tester.tap(find.text('Save property'));
    await tester.pumpAndSettle();

    expect(repository.saved, hasLength(1));
    final property = repository.saved.single;
    expect(property.name, 'Garden View Apartments');
    expect(property.area, 1200);
    expect(property.price, 50000);
    expect(property.location, 'Karachi');
    expect(property.ownerName, 'Ali Khan');
    expect(property.purpose, PropertyPurpose.rent);
    expect(property.status, PropertyStatus.available);
  });

  testWidgets('rejects a malformed owner phone number', (tester) async {
    final repository = RecordingPropertyRepository();
    await pumpForm(tester, repository);

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Property name'),
      'Garden View Apartments',
    );
    await tester.enterText(find.widgetWithText(TextFormField, 'Area'), '1200');
    await tester.enterText(find.widgetWithText(TextFormField, 'Price (PKR)'), '1');
    await tester.enterText(find.widgetWithText(TextFormField, 'Location'), 'K');
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Owner name'),
      'Ali Khan',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Owner phone'),
      '123',
    );

    await tester.tap(find.text('Save property'));
    await tester.pumpAndSettle();

    expect(find.text('Enter a valid phone number'), findsOneWidget);
    expect(repository.saved, isEmpty);
  });

  testWidgets('lays out without overflowing on a narrow screen', (
    tester,
  ) async {
    await pumpForm(tester, RecordingPropertyRepository());

    // The long money units must not overflow their column.
    expect(tester.takeException(), isNull);
  });
}
