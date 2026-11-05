"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import { useAuth } from "@/lib/auth";
import { DataProvider } from "@/lib/data-context";
import { usePreviewRouteReporter } from "@/lib/preview";
import { titleForPath, useDocumentTitle } from "@/lib/use-document-title";
import { useLocalStorageBoolean } from "./popover";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileDrawer, MobileNav } from "./mobile-nav";
import { EstateFlowLogo } from "@/components/brand/estateflow-logo";
import { InlineNotice, Spinner } from "@/components/ui";

function SessionLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-6" aria-busy="true">
      <div className="flex flex-col items-center gap-4 text-center">
        <EstateFlowLogo variant="full" height={42} href="/" />
        <Spinner className="h-5 w-5" />
        <p className="text-[13px] text-muted">{label}</p>
      </div>
    </div>
  );
}

function ConfigurationScreen({ message }: { message: string }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-5 py-12">
      <div className="w-full max-w-lg rounded-card border border-border bg-surface p-7">
        <EstateFlowLogo variant="full" height={40} href="/" />
        <h1 className="mt-6 text-xl font-semibold tracking-[-0.02em] text-ink">
          Firebase configuration required
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">{message}</p>
        <pre className="mt-4 overflow-x-auto rounded-field border border-border bg-surface-2 p-3 text-[11px] leading-5 text-ink-2">
          {`NEXT_PUBLIC_FIREBASE_API_KEY=…
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=…
NEXT_PUBLIC_FIREBASE_PROJECT_ID=…
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=…
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=…
NEXT_PUBLIC_FIREBASE_APP_ID=…`}
        </pre>
        <p className="mt-3 text-[12px] leading-5 text-muted">
          Copy <code className="rounded bg-surface-2 px-1 py-0.5">.env.example</code> to{" "}
          <code className="rounded bg-surface-2 px-1 py-0.5">.env.local</code>, fill in the
          values from the Firebase console, then restart the dev server.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-flex text-[13px] font-medium text-accent underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, configError, profileError } = useAuth();
  const [collapsed, setCollapsed] = useLocalStorageBoolean(
    "estateflow.sidebar.collapsed",
    false,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  usePreviewRouteReporter();
  useDocumentTitle(titleForPath(pathname));

  useEffect(() => {
    if (loading || configError || user) return;
    const query = window.location.search;
    const next = `${pathname}${query}`;
    router.replace(`/login?next=${encodeURIComponent(next)}`);
  }, [loading, configError, user, pathname, router]);

  if (configError) return <ConfigurationScreen message={configError} />;
  if (loading) return <SessionLoader label="Checking your session…" />;
  if (!user) return <SessionLoader label="Taking you to sign in…" />;

  return (
    <DataProvider>
      <div
        style={
          { "--sidebar-w": collapsed ? "76px" : "264px" } as CSSProperties
        }
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-field focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink focus:shadow-pop"
        >
          Skip to content
        </a>

        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />

        <div className="flex min-h-dvh flex-col md:pl-[76px] lg:pl-[var(--sidebar-w)]">
          <Topbar onOpenMenu={() => setDrawerOpen(true)} />

          <main
            id="main-content"
            className="mx-auto w-full max-w-[1360px] flex-1 px-4 pb-24 pt-6 sm:px-6 md:pb-12 lg:px-8 lg:pt-8"
          >
            {profileError ? (
              <div className="mb-5">
                <InlineNotice tone="warning" title="Profile sync is unavailable">
                  Your listings and clients still load. Appearance preferences are
                  saved on this device only. {profileError}
                </InlineNotice>
              </div>
            ) : null}
            {children}
          </main>

          <footer className="hidden border-t border-border px-8 py-4 md:flex md:items-center md:justify-between md:gap-4">
            <p className="text-[11px] text-muted">
              EstateFlow
            </p>
            <div className="flex items-center gap-4 text-[11px] text-muted">
              <Link href="/privacy" className="underline-offset-4 hover:text-ink hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms" className="underline-offset-4 hover:text-ink hover:underline">
                Terms &amp; Conditions
              </Link>
            </div>
          </footer>
        </div>

        {!drawerOpen ? <MobileNav onOpenMenu={() => setDrawerOpen(true)} /> : null}
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </div>
    </DataProvider>
  );
}
