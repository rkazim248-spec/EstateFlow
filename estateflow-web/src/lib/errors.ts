/**
 * Turns errors into messages a person can act on.
 */
export function describeAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
    return "The email or password is incorrect.";
  }
  if (lower.includes("invalid email")) {
    return "Enter a valid email address.";
  }
  if (lower.includes("already registered") || lower.includes("user already exists")) {
    return "An account with this email already exists. Sign in instead.";
  }
  if (lower.includes("password") && lower.includes("weak")) {
    return "Use a stronger password with at least 8 characters.";
  }
  if (lower.includes("too many") || lower.includes("rate limit")) {
    return "Too many attempts. Wait a moment and try again.";
  }
  if (lower.includes("network") || lower.includes("connection")) {
    return "Network unavailable. Check your connection and try again.";
  }
  if (lower.includes("popup") && lower.includes("closed")) {
    return "Sign-in was cancelled before it finished.";
  }
  if (lower.includes("popup") && lower.includes("blocked")) {
    return "Your browser blocked the sign-in window. Allow pop-ups for this site.";
  }
  if (lower.includes("unauthorized") || lower.includes("domain")) {
    return "This domain is not authorised for sign-in.";
  }
  if (lower.includes("disabled")) {
    return "This account has been disabled.";
  }
  if (lower.includes("requires recent login")) {
    return "Please sign in again to complete this action.";
  }

  return message.replace(/^.*:\s*/, "") || "Something went wrong. Please try again.";
}

export function describeDataError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("permission") || lower.includes("rls") || lower.includes("policy")) {
    return "Access denied. Check the security rules for this table.";
  }
  if (lower.includes("unavailable") || lower.includes("network")) {
    return "Database is unreachable right now. Check your connection.";
  }
  if (lower.includes("not found") || lower.includes("no rows")) {
    return "That record no longer exists.";
  }
  if (lower.includes("quota") || lower.includes("rate")) {
    return "Database quota reached. Try again later.";
  }

  return message || "Something went wrong.";
}

export function describeStorageError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("unauthorized") || lower.includes("permission")) {
    return "Storage denied this request. Check the storage policies.";
  }
  if (lower.includes("not found") || lower.includes("bucket")) {
    return "Storage is not available for this project. Enable Storage in the Supabase dashboard.";
  }
  if (lower.includes("quota")) {
    return "The Storage quota has been reached.";
  }
  if (lower.includes("canceled")) {
    return "The upload was cancelled.";
  }

  return message || "The upload failed.";
}