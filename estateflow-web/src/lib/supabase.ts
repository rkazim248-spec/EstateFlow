import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wmkgkuyowryspgcrybbw.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indta2drdXlvd3J5c3BnY3J5YmJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQwNjQ4NzAsImV4cCI6MjEwOTY0MDg3MH0.OpG98bq6WYHOorV8mCCWEyWWaYS0iClGuaaWPVzo33g";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getSupabase() {
  return supabase;
}