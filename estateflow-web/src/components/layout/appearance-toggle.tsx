"use client";

import Link from "next/link";
import { Sun, Moon, Monitor } from "lucide-react";

import { cn } from "@/lib/cn";
import { useTheme, type AppearanceMode } from "@/lib/theme";

const OPTIONS: Array<{ value: AppearanceMode; label: string; icon: typeof Sun }> = [
  { value: "light", label: "Light theme", icon: Sun },
  { value: "dark", label: "Dark theme", icon: Moon },
  { value: "system", label: "System theme", icon: Monitor },
];

export function AppearanceToggle({ className }: { className?: string }) {
  const { mode, setMode } = useTheme();

  return (
    <div
      role="group"
      aria-label="Color theme"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-field border border-border bg-surface p-0.5",
        className,
      )}
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = mode === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setMode(option.value)}
            aria-label={option.label}
            aria-pressed={active}
            title={option.label}
            className={cn(
              "grid h-7 w-7 place-items-center rounded-[7px] transition-colors",
              active
                ? "bg-accent-soft text-accent"
                : "text-muted hover:bg-surface-2 hover:text-ink",
            )}
          >
            <Icon className="h-[15px] w-[15px]" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

export function AuthFooter() {
  return (
    <div className="mt-6 flex items-center justify-between gap-3 text-[11px] text-muted">
      <span>© {new Date().getFullYear()} EstateFlow</span>
      <div className="flex items-center gap-3">
        <Link href="/privacy" className="underline-offset-4 hover:text-ink hover:underline">
          Privacy
        </Link>
        <Link href="/terms" className="underline-offset-4 hover:text-ink hover:underline">
          Terms
        </Link>
      </div>
    </div>
  );
}
