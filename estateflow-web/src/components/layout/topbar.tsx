"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Check,
  ChevronDown,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Palette,
  Settings,
  Sun,
} from "lucide-react";

import { ACCENTS, NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/auth";
import { useTheme, type AppearanceMode } from "@/lib/theme";
import { usePreview } from "@/lib/preview";
import { describeDataError } from "@/lib/errors";
import { Button, buttonClasses, useToast } from "@/components/ui";
import { EstateFlowLogo } from "@/components/brand/estateflow-logo";
import { Popover } from "./popover";

const ACCENT_PREVIEW: Record<string, string> = {
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
  icon: typeof Sun;
}> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

function initials(name: string, email: string): string {
  const source = name.trim() || email.split("@")[0] || "E";
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "E";
}

function sectionLabel(pathname: string): { section: string; page: string | null } {
  const segments = pathname.split("/").filter(Boolean);
  const root = `/${segments[0] ?? "dashboard"}`;
  const item = NAV_ITEMS.find((nav) => nav.href === root);
  const section = item?.label ?? "EstateFlow";

  if (segments.length <= 1) return { section, page: null };
  const last = segments[segments.length - 1];
  if (last === "new") return { section, page: "New" };
  if (last === "edit") return { section, page: "Edit" };
  return { section, page: "Details" };
}

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOutUser } = useAuth();
  const { mode, accent, setMode, setAccent } = useTheme();
  const { enabled, isPreviewFrame, setPreset } = usePreview();
  const { toast } = useToast();

  const [themeOpen, setThemeOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const { section, page } = sectionLabel(pathname);
  const displayName =
    profile?.name || (user?.user_metadata?.full_name as string) || user?.email?.split("@")[0] || "Account";
  const email = profile?.email || user?.email || "";
  const activeAppearance =
    APPEARANCE_OPTIONS.find((option) => option.value === mode) ??
    APPEARANCE_OPTIONS[2];
  const AppearanceIcon = activeAppearance.icon;

  async function persistPreferences(patch: {
    appearance?: AppearanceMode;
    accent?: string;
  }) {
    if (!user) return;
    try {
      await supabase.from("user_profiles").update(patch).eq("id", user.id);
    } catch (error) {
      toast({
        variant: "error",
        title: "Saved on this device only",
        description: describeDataError(error),
      });
    }
  }

  function chooseAppearance(next: AppearanceMode) {
    setMode(next);
    void persistPreferences({ appearance: next });
  }

  function chooseAccent(next: string) {
    setAccent(next);
    void persistPreferences({ accent: next });
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOutUser();
      router.replace("/login");
    } catch (error) {
      toast({
        variant: "error",
        title: "Could not sign out",
        description: describeDataError(error),
      });
      setSigningOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-bg px-4 sm:gap-3 sm:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        className={buttonClasses("ghost", "icon", "-ml-1 md:hidden")}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="md:hidden">
        <EstateFlowLogo variant="compact" height={28} href="/dashboard" />
      </div>

      <div className="hidden min-w-0 items-center gap-2 text-[13px] md:flex">
        <span className="text-muted">EstateFlow</span>
        <span className="text-border-strong" aria-hidden="true">
          /
        </span>
        <span className="truncate font-medium text-ink">{section}</span>
        {page ? (
          <>
            <span className="text-border-strong" aria-hidden="true">
              /
            </span>
            <span className="truncate text-muted">{page}</span>
          </>
        ) : null}
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        {enabled && !isPreviewFrame ? (
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
            icon={<Monitor className="h-4 w-4" aria-hidden="true" />}
            onClick={() => setPreset("desktop")}
            title="Open responsive viewport preview"
          >
            Preview
          </Button>
        ) : null}

        <Popover
          open={themeOpen}
          onClose={() => setThemeOpen(false)}
          trigger={
            <Button
              variant="ghost"
              size="icon"
              aria-label="Appearance settings"
              aria-expanded={themeOpen}
              aria-haspopup="menu"
              onClick={() => setThemeOpen((value) => !value)}
            >
              <AppearanceIcon className="h-[18px] w-[18px]" aria-hidden="true" />
            </Button>
          }
        >
          <div className="px-2 pb-2 pt-1">
            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              <Palette className="h-3 w-3" aria-hidden="true" />
              Appearance
            </p>
            <div className="flex flex-col gap-0.5" role="group" aria-label="Color theme">
              {APPEARANCE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const selected = mode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="menuitemradio"
                    aria-checked={selected}
                    onClick={() => chooseAppearance(option.value)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] font-medium transition-colors",
                      selected
                        ? "bg-accent-soft text-accent"
                        : "text-ink-2 hover:bg-surface-2",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {option.label}
                    {selected ? (
                      <Check className="ml-auto h-3.5 w-3.5" aria-hidden="true" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="border-t border-border px-2 pb-1.5 pt-2.5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              Accent
            </p>
            <div className="flex flex-wrap gap-2 px-1 pb-1">
              {ACCENTS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => chooseAccent(option.id)}
                  aria-label={`${option.name} accent`}
                  aria-pressed={accent === option.id}
                  title={option.name}
                  className={cn(
                    "h-6 w-6 rounded-full border-2 transition-transform",
                    accent === option.id
                      ? "scale-110 border-ink"
                      : "border-transparent hover:scale-105",
                  )}
                  style={{ backgroundColor: ACCENT_PREVIEW[option.id] }}
                />
              ))}
            </div>
          </div>
        </Popover>

        <div className="mx-0.5 hidden h-6 w-px bg-border sm:block" aria-hidden="true" />

        <Popover
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          trigger={
            <button
              type="button"
              onClick={() => setProfileOpen((value) => !value)}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-field px-1 py-1 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent">
                {initials(displayName, email)}
              </span>
              <span className="hidden max-w-[140px] items-center gap-1 lg:flex">
                <span className="truncate text-[13px] font-medium text-ink">
                  {displayName}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
              </span>
            </button>
          }
        >
          <div className="border-b border-border px-2.5 pb-2.5 pt-2">
            <p className="truncate text-[13px] font-semibold text-ink">{displayName}</p>
            <p className="truncate text-[11px] text-muted">{email}</p>
          </div>
          <div className="pt-1.5">
            <Link
              href="/settings"
              onClick={() => setProfileOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
              role="menuitem"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
              Settings
            </Link>
            <div className="mt-1 border-t border-border pt-1">
              <button
                type="button"
                onClick={() => void handleSignOut()}
                disabled={signingOut}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-danger transition-colors hover:bg-danger-soft disabled:opacity-60"
                role="menuitem"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {signingOut ? "Signing out…" : "Log out"}
              </button>
            </div>
          </div>
        </Popover>
      </div>
    </header>
  );
}
