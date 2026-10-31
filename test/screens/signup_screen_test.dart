import 'package:estateflow/screens/auth/signup_screen.dart';
import 'package:estateflow/services/auth_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

Future<void> pumpSignup(WidgetTester tester) async {
  tester.view.physicalSize = const Size(400, 1400);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.reset);

  await tester.pumpWidget(
    MaterialApp(home: SignupScreen(authService: AuthService())),
  );
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('offers every sign-up field', (tester) async {
    await pumpSignup(tester);

    expect(find.text('Name'), findsOneWidget);
    expect(find.text('Email'), findsOneWidget);
    expect(find.text('Password'), findsOneWidget);
    expect(find.text('Confirm password'), findsOneWidget);
    expect(find.text('Sign Up'), findsOneWidget);
    expect(find.text('Sign up with Google'), findsOneWidget);
  });

  testWidgets('requires every field', (tester) async {
    await pumpSignup(tester);

    await tester.tap(find.text('Sign Up'));
    await tester.pumpAndSettle();

    expect(find.text('Enter your name'), findsOneWidget);
    expect(find.text('Enter your email address'), findsOneWidget);
    expect(find.text('Enter a password'), findsOneWidget);
    expect(find.text('Confirm your password'), findsOneWidget);
  });

  testWidgets('requires the two passwords to match', (tester) async {
    await pumpSignup(tester);

    await tester.enterText(
      find.widgetWithText(TextFormField, 'Name'),
      'Ali Khan',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Email'),
      'ali@estateflow.app',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Password'),
      'correct horse',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Confirm password'),
      'different horse',
    );

    await tester.tap(find.text('Sign Up'));
    await tester.pumpAndSettle();

    expect(find.text('Passwords do not match'), findsOneWidget);
  });
}
