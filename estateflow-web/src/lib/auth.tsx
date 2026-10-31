"use client";

import { onAuthStateChanged, signOut, type User } from "firebase/auth";
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

import { ensureUserProfile } from "./data";
import { describeAuthError, describeDataError } from "./errors";
import { FirebaseNotConfiguredError, getFirebase, isFirebaseConfigured } from "./firebase";
import { useTheme } from "./theme";
import type { UserProfile } from "./types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  /** True until Firebase has resolved the persisted session. */
  loading: boolean;
  configError: string | null;
  profileError: string | null;
  refreshProfile: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { applyRemotePreferences } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const userRef = useRef<User | null>(null);

  const loadProfile = useCallback(
    async (nextUser: User) => {
      try {
        const nextProfile = await ensureUserProfile(nextUser);
        if (userRef.current?.uid !== nextUser.uid) return;
        setProfile(nextProfile);
        setProfileError(null);
        applyRemotePreferences(nextProfile.appearance, nextProfile.accent);
      } catch (error) {
        if (userRef.current?.uid !== nextUser.uid) return;
        setProfile(null);
        setProfileError(describeDataError(error));
      }
    },
    [applyRemotePreferences],
  );

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setConfigError(new FirebaseNotConfiguredError().message);
      setLoading(false);
      return;
    }

    let unsubscribe = () => {};
    try {
      const { auth } = getFirebase();
      unsubscribe = onAuthStateChanged(
        auth,
        (nextUser) => {
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
        (error) => {
          setConfigError(describeAuthError(error));
          setLoading(false);
        },
      );
    } catch (error) {
      setConfigError(
        error instanceof Error ? error.message : "Firebase could not start.",
      );
      setLoading(false);
    }

    return () => unsubscribe();
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (userRef.current) await loadProfile(userRef.current);
  }, [loadProfile]);

  const signOutUser = useCallback(async () => {
    const { auth } = getFirebase();
    await signOut(auth);
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
