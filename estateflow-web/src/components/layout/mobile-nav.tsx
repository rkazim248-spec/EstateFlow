"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { HardHat, LogOut, MoreHorizontal, X } from "lucide-react";

import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/cn";
import { useAuth } from "@/lib/auth";
import { EstateFlowLogo } from "@/components/brand/estateflow-logo";
import { NavLinks, isNavItemActive } from "./sidebar";
import { NAV_ICONS } from "./nav-icons";

const BOTTOM_ITEMS = [
  { href: "/dashboard", label: "Home", icon: "dashboard" },
  { href: "/properties", label: "Properties", icon: "properties" },
  { href: "/clients", label: "Clients", icon: "clients" },
  { href: "/ai-studio", label: "AI Image Studio", icon: "sparkles" },
  { href: "/media", label: "Media Library", icon: "media" },
  { href: "/social", label: "Social Media Hub", icon: "social" },
  { href: "/settings", label: "Settings", icon: "settings" },
] as const;

export function MobileNav({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="grid grid-cols-5">
        {BOTTOM_ITEMS.map((item) => {
          const Icon = NAV_ICONS[item.icon];
          const active = isNavItemActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-[58px] flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                active ? "text-accent" : "text-muted",
              )}
            >
              <Icon
                className="h-[19px] w-[19px]"
                strokeWidth={active ? 2.1 : 1.8}
                aria-hidden="true"
              />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onOpenMenu}
          className="flex h-[58px] flex-col items-center justify-center gap-1 text-[10px] font-medium text-muted transition-colors hover:text-ink"
        >
          <MoreHorizontal className="h-[19px] w-[19px]" aria-hidden="true" />
          More
        </button>
      </div>
    </nav>
  );
}

export function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const { user, profile, signOutUser } = useAuth();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    onClose();
    // Close the drawer whenever the route changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!open) return null;

  const displayName =
    profile?.name || user?.displayName || user?.email?.split("@")[0] || "Account";

  return (
    <div className="fixed inset-0 z-[70] md:hidden">
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={onClose}
        className="absolute inset-0 bg-black/45"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="absolute inset-y-0 left-0 flex w-[290px] max-w-[85vw] animate-slide-up flex-col border-r border-border bg-surface"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
          <EstateFlowLogo variant="compact" height={30} href="/dashboard" />
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-field text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            aria-label="Close navigation menu"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Workspace
          </p>
          <NavLinks onNavigate={onClose} />
        </div>

        <div className="shrink-0 border-t border-border px-4 py-3">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent">
              {displayName.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-ink">{displayName}</p>
              <p className="truncate text-[11px] text-muted">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/privacy"
              onClick={onClose}
              className="text-[11px] text-muted underline-offset-4 hover:text-ink hover:underline"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              onClick={onClose}
              className="text-[11px] text-muted underline-offset-4 hover:text-ink hover:underline"
            >
              Terms
            </Link>
            <Link
              href="/settings"
              onClick={onClose}
              className="text-[11px] text-muted underline-offset-4 hover:text-ink hover:underline"
            >
              Settings
            </Link>
            <button
              type="button"
              onClick={() => void signOutUser()}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-danger"
            >
              <LogOut className="h-3 w-3" aria-hidden="true" />
              Log out
            </button>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[10px] text-muted">
            <HardHat className="h-3 w-3" aria-hidden="true" />
            {NAV_ITEMS.length} modules · PKR workspace
          </p>
        </div>
      </div>
    </div>
  );
}
