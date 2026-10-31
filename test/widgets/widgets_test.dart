import 'package:estateflow/core/error_messages.dart';
import 'package:estateflow/widgets/stat_card.dart';
import 'package:estateflow/widgets/status_chip.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('friendlyAuthError', () {
    test('explains a wrong password', () {
      final message = friendlyAuthError(
        FirebaseAuthException(code: 'wrong-password'),
      );
      expect(message, 'Incorrect email or password.');
    });

    test('explains a duplicate account', () {
      final message = friendlyAuthError(
        FirebaseAuthException(code: 'email-already-in-use'),
      );
      expect(message, 'An account already exists for that email.');
    });

    test('falls back for unknown errors', () {
      expect(
        friendlyAuthError(Exception('boom')),
        'Something went wrong. Please try again.',
      );
    });
  });

  group('StatCard', () {
    testWidgets('shows the label and the count', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: StatCard(
              label: 'Total Properties',
              value: 7,
              icon: Icons.home_work_outlined,
            ),
          ),
        ),
      );
      // The value counts up, so let the animation settle before asserting.
      await tester.pumpAndSettle();

      expect(find.text('Total Properties'), findsOneWidget);
      expect(find.text('7'), findsOneWidget);
      expect(find.byIcon(Icons.home_work_outlined), findsOneWidget);
    });
  });

  group('StatusChip', () {
    testWidgets('renders the status label', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(body: StatusChip(status: 'Available')),
        ),
      );

      expect(find.text('Available'), findsOneWidget);
    });
  });
}
