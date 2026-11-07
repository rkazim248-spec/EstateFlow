// Re-export Supabase client for backward compatibility.
export { supabase as getFirebase, supabase } from "./auth";
export const isFirebaseConfigured = true;
export class FirebaseNotConfiguredError extends Error {
  constructor() {
    super("Supabase is not configured.");
  }
}