import { FirebaseError } from "firebase/app";

/**
 * Turns Firebase errors into messages a person can act on. Unknown errors fall
 * back to the provider message rather than a generic "something went wrong".
 */
export function describeAuthError(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "The email or password is incorrect.";
      case "auth/invalid-email":
        return "Enter a valid email address.";
      case "auth/email-already-in-use":
        return "An account with this email already exists. Sign in instead.";
      case "auth/weak-password":
        return "Use a stronger password with at least 8 characters.";
      case "auth/too-many-requests":
        return "Too many attempts. Wait a moment and try again.";
      case "auth/network-request-failed":
        return "Network unavailable. Check your connection and try again.";
      case "auth/popup-closed-by-user":
      case "auth/cancelled-popup-request":
        return "Google sign-in was cancelled before it finished.";
      case "auth/popup-blocked":
        return "Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.";
      case "auth/unauthorized-domain":
        return "This domain is not authorised for Google sign-in. Add it under Firebase Console → Authentication → Settings → Authorized domains.";
      case "auth/account-exists-with-different-credential":
        return "This email is already registered with a different sign-in method. Use that method instead.";
      case "auth/operation-not-allowed":
        return "This sign-in method is disabled in the Firebase console.";
      case "auth/user-disabled":
        return "This account has been disabled.";
      case "auth/requires-recent-login":
        return "Please sign in again to complete this action.";
      default:
        return error.message.replace(/^Firebase:\s*/i, "");
    }
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export function describeDataError(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "permission-denied":
        return "Firestore denied this request. Check the deployed security rules for this collection.";
      case "unavailable":
        return "Firestore is unreachable right now. Check your connection.";
      case "failed-precondition":
        return "This query needs a Firestore index. Check the browser console for the index link.";
      case "not-found":
        return "That record no longer exists.";
      case "resource-exhausted":
        return "Firestore quota reached. Try again later.";
      default:
        return error.message.replace(/^Firebase:\s*/i, "");
    }
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function describeStorageError(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "storage/unauthorized":
        return "Cloud Storage denied this request. Storage rules must allow this user's media folder.";
      case "storage/unknown":
        return "Cloud Storage is not available for this project. Enable Storage in the Firebase console.";
      case "storage/quota-exceeded":
        return "The Storage quota has been reached.";
      case "storage/canceled":
        return "The upload was cancelled.";
      case "storage/retry-limit-exceeded":
        return "The upload timed out. Try a smaller file or a better connection.";
      default:
        return error.message.replace(/^Firebase:\s*/i, "");
    }
  }
  return error instanceof Error ? error.message : "The upload failed.";
}
