"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { updateProfile } from "firebase/auth";
import {
  ArrowRight,
  Check,
  Database,
  KeyRound,
  Lock,
  LogOut,
  Monitor,
  Moon,
  PlugZap,
  ShieldCheck,
  Sun,
  UserRound,
} from "lucide-react";

import { useAuth } from "@/lib/auth";
import { ACCENTS } from "@/lib/constants";
import { updateUserProfile } from "@/lib/data";
import { describeAuthError, describeDataError } from "@/lib/errors";
import { useTheme, type AppearanceMode } from "@/lib/theme";
import { profileSchema } from "@/lib/validation";
import {
  Badge,
  Button,
  Card,
  Field,
  InlineNotice,
  Input,
  PageHeader,
  SegmentedControl,
  SectionHeading,
  useToast,
} from "@/components/ui";
import { cn } from "@/lib/cn";

const ACCENT_HEX: Record<string, string> = {
  teal: "#00696d",
  indigo: "#3f5ba9",
  violet: "#6d43c4",
  cyan: "#00696e",
  terracotta: "#8f4c38",
  forest: "#2e6b33",
};

const APPEARANCE_OPTIONS: Array<{
  value: AppearanceMode;
  label: string;
  icon: React.ReactNode;
}> = [
  { value: "light", label: "Light", icon: <Sun className="h-3.5 w-3.5" /> },
  { value: "dark", label: "Dark", icon: <Moon className="h-3.5 w-3.5" /> },
  { value: "system", label: "System", icon: <Monitor className="h-3.5 w-3.5" /> },
];

function initials(name: string, email: string): string {
  const source = name.trim() || email.trim();
  if (!source) return "EF";
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return (parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "EF").slice(0, 2);
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, profileError, refreshProfile, signOutUser } = useAuth();
  const { mode, accent, setMode, setAccent } = useTheme();
  const { toast } = useToast();

  const currentName = profile?.name || user?.displayName || "";
  const currentEmail = profile?.email || user?.email || "";

  const [name, setName] = useState(currentName);
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setName(currentName);
  }, [currentName]);

  const trimmedName = name.trim();
  const dirty = trimmedName !== currentName.trim();

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || saving) return;

    const parsed = profileSchema.safeParse({ name });
    if (!parsed.success) {
      setNameError(parsed.error.issues[0]?.message ?? "Enter your name.");
      return;
    }

    setNameError(null);
    setSaveError(null);
    setSaving(true);
    try {
      if (user.displayName !== parsed.data.name) {
        await updateProfile(user, { displayName: parsed.data.name });
      }
      await updateUserProfile(user.uid, { name: parsed.data.name });
      await refreshProfile();
      toast({ variant: "success", title: "Profile updated", description: "Your name is saved for this account." });
    } catch (error) {
      setSaveError(describeAuthError(error));
    } finally {
      setSaving(false);
    }
  }

  function persistTheme(patch: { appearance?: AppearanceMode; accent?: string }) {
    if (!user) return;
    void updateUserProfile(user.uid, patch).catch((error) => {
      toast({
        variant: "error",
        title: "Appearance saved on this device only",
        description: describeDataError(error),
      });
    });
  }

  function chooseMode(next: AppearanceMode) {
    setMode(next);
    persistTheme({ appearance: next });
  }

  function chooseAccent(next: string) {
    setAccent(next);
    persistTheme({ accent: next });
  }

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOutUser();
      router.replace("/login");
    } catch (error) {
      toast({
        variant: "error",
        title: "Could not sign out",
        description: describeAuthError(error),
      });
      setSigningOut(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Your profile, appearance and session. Preferences are stored on this device immediately and synced to your account when Firestore allows it."
      />

      {profileError ? (
        <div className="mb-5">
          <InlineNotice tone="warning" title="Profile sync unavailable">
            {profileError} Appearance still works locally. Deploy the{" "}
            <code className="rounded bg-surface-2 px-1 py-0.5 text-[11px]">users/&#123;uid&#125;</code>{" "}
            Firestore rules described in the README to sync your name and theme.
          </InlineNotice>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          <Card className="p-5 sm:p-6">
            <SectionHeading
              title="Profile"
              description="The name shown in EstateFlow. Your email address is the sign-in identity and is not edited here."
            />

            <div className="mt-5 flex items-center gap-3">
              <div
                aria-hidden="true"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-semibold tracking-wide text-accent"
              >
                {initials(currentName, currentEmail)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  {currentName || "EstateFlow user"}
                </p>
                <p className="truncate text-[12px] text-muted">
                  {currentEmail || "No email on this session"}
                </p>
              </div>
            </div>

            <form className="mt-5 space-y-4" onSubmit={saveProfile} noValidate>
              {saveError ? (
                <InlineNotice tone="danger" title="Could not save your profile">
                  {saveError}
                </InlineNotice>
              ) : null}

              <Field
                label="Display name"
                htmlFor="profile-name"
                required
                error={nameError ?? undefined}
                hint="Used in the sidebar, greetings and your account menu."
              >
                <Input
                  id="profile-name"
                  name="name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    if (nameError) setNameError(null);
                  }}
                  autoComplete="name"
                  maxLength={120}
                  aria-invalid={Boolean(nameError)}
                  aria-describedby={nameError ? "profile-name-error" : undefined}
                  disabled={saving}
                />
              </Field>

              <Field
                label="Email address"
                htmlFor="profile-email"
                hint="Managed by Firebase Authentication. Sign in with the same email on the mobile app."
              >
                <Input
                  id="profile-email"
                  name="email"
                  value={currentEmail}
                  readOnly
                  disabled
                  autoComplete="email"
                />
              </Field>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <p className="text-[11px] text-muted">
                  {dirty ? "You have unsaved changes." : "Everything is saved."}
                </p>
                <Button type="submit" loading={saving} disabled={!dirty || !user}>
                  Save profile
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionHeading
              title="Appearance"
              description="One neutral base and a curated accent. Both modes meet contrast requirements; System follows your operating system."
            />

            <div className="mt-5 space-y-5">
              <div>
                <p className="mb-2 text-[13px] font-medium text-ink">Theme</p>
                <SegmentedControl<AppearanceMode>
                  value={mode}
                  onChange={chooseMode}
                  ariaLabel="Color theme"
                  options={APPEARANCE_OPTIONS}
                />
              </div>

              <div>
                <p className="mb-2 text-[13px] font-medium text-ink">Accent color</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {ACCENTS.map((option) => {
                    const active = accent === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => chooseAccent(option.id)}
                        aria-pressed={active}
                        className={cn(
                          "flex items-center gap-2.5 rounded-field border px-3 py-2.5 text-left transition-colors",
                          active
                            ? "border-accent bg-accent-soft/50"
                            : "border-border bg-surface hover:border-border-strong hover:bg-surface-2",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-black/10"
                          style={{ backgroundColor: ACCENT_HEX[option.id] ?? "#00696d" }}
                        >
                          {active ? (
                            <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                          ) : null}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[12px] font-medium text-ink">
                            {option.name}
                          </span>
                          <span className="block truncate text-[10px] text-muted">
                            {option.hint}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[11px] leading-5 text-muted">
                  Changes apply instantly and are remembered on this device. When
                  Firestore is reachable they are also saved to your profile.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionHeading
              title="Session"
              description="Signing out ends this browser session. The mobile app keeps its own session."
            />

            <dl className="mt-5 divide-y divide-border border-y border-border text-[13px]">
              <div className="flex flex-wrap items-center justify-between gap-3 py-3">
                <dt className="text-muted">Signed in as</dt>
                <dd className="font-medium text-ink">{currentEmail || "Unknown"}</dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 py-3">
                <dt className="text-muted">Authentication</dt>
                <dd>
                  <Badge tone="neutral">
                    {user?.providerData.some((provider) => provider.providerId === "google.com")
                      ? "Google + password"
                      : "Email and password"}
                  </Badge>
                </dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 py-3">
                <dt className="text-muted">User id</dt>
                <dd className="max-w-[220px] truncate font-mono text-[11px] text-ink-2" title={user?.uid}>
                  {user?.uid ?? "—"}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Link
                href="/forgot-password"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-field border border-border-strong bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
              >
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                Send password reset
              </Link>
              <Button
                variant="danger"
                loading={signingOut}
                icon={<LogOut className="h-4 w-4" aria-hidden="true" />}
                onClick={handleSignOut}
              >
                Sign out
              </Button>
            </div>
            <p className="mt-3 text-[11px] leading-5 text-muted">
              The reset link only helps accounts that sign in with a password.
              Google-only accounts are managed by Google.
            </p>
          </Card>
        </div>

        <aside className="min-w-0 space-y-4">
          <Card className="p-5">
            <h2 className="text-[13px] font-semibold text-ink">This workspace</h2>
            <ul className="mt-3 space-y-3 text-[12px] leading-5 text-ink-2">
              <li className="flex gap-2.5">
                <Database className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                <span>
                  Properties and clients are the same Firestore records the
                  EstateFlow mobile app reads. Changes appear in both.
                </span>
              </li>
              <li className="flex gap-2.5">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                <span>
                  Images are objects under{" "}
                  <code className="rounded bg-surface-2 px-1 py-0.5 text-[10px]">
                    users/&#123;uid&#125;/media
                  </code>
                  . Firestore holds metadata only.
                </span>
              </li>
              <li className="flex gap-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                <span>
                  Records are visible to signed-in members of this Firebase
                  project. The README documents the stricter owner-scoped rules
                  and the backfill that legacy records need first.
                </span>
              </li>
              <li className="flex gap-2.5">
                <PlugZap className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                <span>
                  AI image generation and social publishing stay off until API
                  credentials and a background publisher are configured.
                </span>
              </li>
            </ul>
          </Card>

          <Card className="p-5">
            <h2 className="text-[13px] font-semibold text-ink">Legal</h2>
            <div className="mt-2 divide-y divide-border text-[12px]">
              <Link
                href="/privacy"
                className="flex items-center justify-between gap-2 py-2.5 text-ink-2 transition-colors hover:text-accent"
              >
                Privacy Policy
                <ArrowRight className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
              </Link>
              <Link
                href="/terms"
                className="flex items-center justify-between gap-2 py-2.5 text-ink-2 transition-colors hover:text-accent"
              >
                Terms of Use
                <ArrowRight className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
              </Link>
            </div>
          </Card>

          <div className="flex items-center gap-2 px-1 text-[11px] text-muted">
            <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
            EstateFlow web · account settings
          </div>
        </aside>
      </div>
    </div>
  );
}
