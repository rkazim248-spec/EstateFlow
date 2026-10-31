import type { ReactNode } from "react";
import { Building2, Handshake, Users } from "lucide-react";

import { EstateFlowLogo } from "@/components/brand/estateflow-logo";
import { AppearanceToggle, AuthFooter } from "@/components/layout/appearance-toggle";

const FEATURES = [
  {
    icon: Building2,
    title: "Listings with real numbers",
    body: "Sale and rental prices in Lakh, Crore and per-month units, normalised to PKR for comparison.",
  },
  {
    icon: Users,
    title: "Clients and intent",
    body: "Buyers and renters, budgets, preferred areas and follow-up status — kept in one record.",
  },
  {
    icon: Handshake,
    title: "EstateFlow",
    body: "See why a property fits a client, and exactly which requirement it misses.",
  },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[1.02fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-surface-2 px-10 py-10 lg:flex xl:px-14 xl:py-12">
        <EstateFlowLogo variant="full" height={54} href="/login" />

        <div className="relative z-10 max-w-[520px] py-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            Property &amp; client workspace
          </p>
          <h1 className="mt-4 font-display text-[46px] leading-[1.03] tracking-[-0.015em] text-ink xl:text-[54px]">
            Every listing and every client, in one calm place.
          </h1>
          <p className="mt-5 max-w-[420px] text-sm leading-6 text-ink-2">
            EstateFlow keeps the day-to-day of a Pakistani real-estate desk
            organised: listings, buyers and renters, and the matches between
            them.
          </p>

          <ul className="mt-9 space-y-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <li key={feature.title} className="flex gap-3.5">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-surface text-accent">
                    <Icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-ink">{feature.title}</p>
                    <p className="mt-0.5 max-w-[380px] text-[12.5px] leading-5 text-muted">
                      {feature.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-5 text-[11px] text-muted">
          <span>PKR · Lakh · Crore</span>
          <span className="text-border-strong" aria-hidden="true">
            /
          </span>
          <span>Shared Firebase data with the mobile app</span>
        </div>

        <svg
          aria-hidden="true"
          viewBox="0 0 420 420"
          className="pointer-events-none absolute -bottom-16 -right-20 h-[380px] w-[380px] text-border-strong opacity-40"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        >
          <path d="M60 214 210 76l150 138" />
          <path d="M94 190v158h232V190" />
          <path d="M170 348V248h80v100" />
          <path d="M210 76v-28" />
          <circle cx="210" cy="214" r="178" strokeDasharray="2 8" />
        </svg>
      </aside>

      <div className="flex min-h-dvh flex-col">
        <header className="flex h-16 shrink-0 items-center justify-end px-5 sm:px-8">
          <AppearanceToggle />
        </header>

        <main className="flex flex-1 items-center justify-center px-5 pb-8 sm:px-8">
          <div className="w-full max-w-[404px]">{children}</div>
        </main>

        <footer className="px-5 pb-6 sm:px-8">
          <AuthFooter />
        </footer>
      </div>
    </div>
  );
}
