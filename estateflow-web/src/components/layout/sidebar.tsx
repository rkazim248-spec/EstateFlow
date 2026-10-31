"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { NAV_ICONS } from "./nav-icons";
import { EstateFlowLogo } from "@/components/brand/estateflow-logo";

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({
  compact = false,
  onNavigate,
  className,
}: {
  compact?: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-1", className)} aria-label="Main navigation">
      {NAV_ITEMS.map((item) => {
        const Icon = NAV_ICONS[item.icon];
        const active = isNavItemActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={compact ? item.label : undefined}
            aria-label={compact ? item.label : undefined}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex h-10 items-center rounded-lg text-[13.5px] font-medium transition-colors",
              compact ? "justify-center px-0" : "gap-3 px-3",
              active
                ? "bg-accent-soft text-accent"
                : "text-ink-2 hover:bg-surface-2 hover:text-ink",
            )}
          >
            <Icon
              className={cn(
                "h-[18px] w-[18px] shrink-0",
                active ? "text-accent" : "text-muted group-hover:text-ink",
              )}
              strokeWidth={1.8}
              aria-hidden="true"
            />
            {compact ? null : <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[76px] flex-col border-r border-border bg-sidebar md:flex lg:w-[var(--sidebar-w)]">
      <div className="flex h-16 shrink-0 items-center justify-center border-b border-border px-3 lg:justify-start lg:px-4">
        <EstateFlowLogo
          variant="symbol"
          height={32}
          href="/dashboard"
          className="lg:hidden"
        />
        <EstateFlowLogo
          variant={collapsed ? "symbol" : "compact"}
          height={collapsed ? 32 : 34}
          href="/dashboard"
          className="hidden min-w-0 lg:inline-flex"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {collapsed ? null : (
          <p className="mb-2 hidden px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted lg:block">
            Workspace
          </p>
        )}
        <NavLinks compact={collapsed} />
      </div>

      <div className="shrink-0 border-t border-border p-3">
        {collapsed ? null : (
          <div className="mb-3 hidden rounded-lg border border-border bg-surface px-3 py-2.5 lg:block">
            <p className="text-[11px] font-semibold text-ink">Shared workspace</p>
            <p className="mt-0.5 text-[11px] leading-4 text-muted">
              Same Firebase records as the mobile app.
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="hidden h-9 w-full items-center justify-center gap-2 rounded-lg text-[12px] font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink lg:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" aria-hidden="true" />
          ) : (
            <>
              <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
