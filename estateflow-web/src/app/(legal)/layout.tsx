import type { ReactNode } from "react";
import Link from "next/link";

import { AppearanceToggle } from "@/components/layout/appearance-toggle";
import { EstateFlowLogo } from "@/components/brand/estateflow-logo";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-4 px-5 sm:px-8">
          <EstateFlowLogo variant="compact" height={30} href="/dashboard" />
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden text-[12px] font-medium text-ink-2 underline-offset-4 hover:text-accent hover:underline sm:inline"
            >
              Open the app
            </Link>
            <AppearanceToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 pb-16 pt-9 sm:px-8 sm:pt-12">
        {children}
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-5 py-6 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>© {new Date().getFullYear()} EstateFlow</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="underline-offset-4 hover:text-ink hover:underline">
              Privacy
            </Link>
            <Link href="/terms" className="underline-offset-4 hover:text-ink hover:underline">
              Terms
            </Link>
            <Link href="/login" className="underline-offset-4 hover:text-ink hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
