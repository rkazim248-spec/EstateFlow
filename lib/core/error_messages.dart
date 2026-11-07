/// Maps auth failures to messages a person can act on. Unknown errors fall
/// back to the provider message rather than a generic "something went wrong".
String friendlyAuthError(Object error) {
  final message = error.toString().toLowerCase();

  if (message.contains('invalid login credentials') ||
      message.contains('invalid credentials') ||
      message.contains('wrong password') ||
      message.contains('user not found')) {
    return 'The email or password is incorrect.';
  }
  if (message.contains('invalid email')) {
    return 'Enter a valid email address.';
  }
  if (message.contains('already registered') ||
      message.contains('user already exists')) {
    return 'An account with this email already exists. Sign in instead.';
  }
  if (message.contains('password') && message.contains('weak')) {
    return 'Use a stronger password with at least 8 characters.';
  }
  if (message.contains('too many requests') || message.contains('rate limit')) {
    return 'Too many attempts. Wait a moment and try again.';
  }
  if (message.contains('network') || message.contains('connection')) {
    return 'Network unavailable. Check your connection and try again.';
  }
  if (message.contains('popup') && message.contains('closed')) {
    return 'Sign-in was cancelled before it finished.';
  }
  if (message.contains('popup') && message.contains('blocked')) {
    return 'Your browser blocked the sign-in window. Allow pop-ups for this site.';
  }
  if (message.contains('unauthorized') || message.contains('domain')) {
    return 'This domain is not authorised for sign-in. Add it under Supabase settings.';
  }
  if (message.contains('disabled')) {
    return 'This account has been disabled.';
  }
  if (message.contains('requires recent login')) {
    return 'Please sign in again to complete this action.';
  }

  return error.toString().replaceFirst('Exception: ', '');
}