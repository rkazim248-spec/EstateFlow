import 'package:estateflow/core/constants.dart';
import 'package:estateflow/models/client.dart';
import 'package:estateflow/screens/clients/client_form_screen.dart';
import 'package:estateflow/services/client_repository.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// A repository that records saves instead of talking to Firestore.
class RecordingClientRepository extends ClientRepository {
  RecordingClientRepository();

  final List<Client> saved = [];

  @override
  Future<void> save(Client client) async => saved.add(client);
}

/// Pumps the form on a narrow phone-sized surface that is tall enough to
/// build every field, so nothing needs to be scrolled during the test.
Future<void> pumpForm(
  WidgetTester tester,
  RecordingClientRepository repository,
) async {
  tester.view.physicalSize = const Size(400, 2400);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.reset);

  await tester.pumpWidget(
    MaterialApp(
      home: ClientFormScreen(repository: repository),
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
    await pumpForm(tester, RecordingClientRepository());

    expect(find.text('Custom bedroom details'), findsNothing);

    await selectDropdown(tester, 1, Bedrooms.custom);

    expect(find.text('Custom bedroom details'), findsOneWidget);
  });

  testWidgets('budget units follow the selected purpose', (tester) async {
    await pumpForm(tester, RecordingClientRepository());

    // Buy is selected by default, so the sale units are offered.
    expect(find.text('Lakh'), findsOneWidget);
    expect(find.text('Thousand Per Month'), findsNothing);

    await tester.tap(find.text('Rent'));
    await tester.pumpAndSettle();

    expect(find.text('Thousand Per Month'), findsOneWidget);
    expect(find.text('Lakh'), findsNothing);
  });

  testWidgets('requires a name and a valid phone number', (tester) async {
    final repository = RecordingClientRepository();
    await pumpForm(tester, repository);

    await tester.tap(find.text('Save client'));
    await tester.pumpAndSettle();

    expect(find.text('Enter the client name'), findsOneWidget);
    expect(find.text('Enter a phone number'), findsOneWidget);
    expect(repository.saved, isEmpty);
  });

  testWidgets('saves a new client with the entered values', (tester) async {
    final repository = RecordingClientRepository();
    await pumpForm(tester, repository);

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Client name'),
      'Bilal Ahmed',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Phone number'),
      '+923111111111',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Budget (PKR)'),
      '250',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Preferred location'),
      'Islamabad',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Client requirements'),
      'Near school',
    );

    await tester.tap(find.text('Save client'));
    await tester.pumpAndSettle();

    expect(repository.saved, hasLength(1));
    final client = repository.saved.single;
    expect(client.name, 'Bilal Ahmed');
    expect(client.phone, '+923111111111');
    expect(client.budget, 250);
    expect(client.location, 'Islamabad');
    expect(client.requirements, 'Near school');
    expect(client.purpose, ClientPurpose.buy);
    expect(client.status, ClientStatus.newLead);
  });

  testWidgets('lays out without overflowing on a narrow screen', (
    tester,
  ) async {
    await pumpForm(tester, RecordingClientRepository());

    expect(tester.takeException(), isNull);
  });
}
