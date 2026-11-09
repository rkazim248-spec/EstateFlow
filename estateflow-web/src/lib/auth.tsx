"use client";

import { createClient } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wmkgkuyowryspgcrybbw.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indta2drdXlvd3J5c3BnY3J5YmJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQwNjQ4NzAsImV4cCI6MjEwOTY0MDg3MH0.OpG98bq6WYHOorV8mCCWEyWWaYS0iClGuaaWPVzo33g";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AuthContextValue {
  user: { id: string; email: string | null; user_metadata?: Record<string, unknown> } | null;
  profile: { id: string; name: string; email: string; appearance: string; accent: string } | null;
  loading: boolean;
  configError: string | null;
  profileError: string | null;
  refreshProfile: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextValue["user"]>(null);
  const [profile, setProfile] = useState<AuthContextValue["profile"]>(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const userRef = useRef<AuthContextValue["user"]>(null);

  const loadProfile = useCallback(async (nextUser: AuthContextValue["user"]) => {
    if (!nextUser) return;
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", nextUser.id)
        .single();
      if (error) throw error;
      if (userRef.current?.id !== nextUser.id) return;
      setProfile(data as AuthContextValue["profile"]);
      setProfileError(null);
    } catch (error) {
      if (userRef.current?.id !== nextUser.id) return;
      setProfile(null);
      setProfileError(error instanceof Error ? error.message : "Could not load profile.");
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const nextUser = session?.user
          ? { id: session.user.id, email: session.user.email ?? null, user_metadata: session.user.user_metadata }
          : null;
        userRef.current = nextUser;
        setUser(nextUser);
        setLoading(false);
        if (nextUser) {
          void loadProfile(nextUser);
        } else {
          setProfile(null);
          setProfileError(null);
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (userRef.current) await loadProfile(userRef.current);
  }, [loadProfile]);

  const signOutUser = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      configError,
      profileError,
      refreshProfile,
      signOutUser,
    }),
    [user, profile, loading, configError, profileError, refreshProfile, signOutUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>.");
  return context;
}