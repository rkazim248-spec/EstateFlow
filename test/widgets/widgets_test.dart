import 'package:estateflow/core/error_messages.dart';
import 'package:estateflow/widgets/stat_card.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('friendlyAuthError', () {
    test('explains a wrong password', () {
      final message = friendlyAuthError(Exception('invalid login credentials'));
      expect(message, 'The email or password is incorrect.');
    });

    test('explains a duplicate account', () {
      final message = friendlyAuthError(Exception('user already exists'));
      expect(message, 'An account with this email already exists. Sign in instead.');
    });

    test('falls back for unknown errors', () {
      expect(
        friendlyAuthError(Exception('boom')),
        'boom',
      );
    });
  });

  group('StatCard', () {
    testWidgets('shows the label and the count', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatCard(label: 'Properties', value: 42, icon: Icons.home),
          ),
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Properties'), findsOneWidget);
      expect(find.text('42'), findsOneWidget);
    });
  });
}