import Link from "next/link";

import { cn } from "@/lib/cn";

export type EstateFlowLogoVariant = "full" | "compact" | "symbol";
export type EstateFlowLogoTone = "auto" | "light" | "dark";

const ASSETS = {
  full: {
    light: "/brand/estateflow-logo.svg",
    dark: "/brand/estateflow-logo-dark.svg",
    width: 877,
    height: 238,
  },
  compact: {
    light: "/brand/estateflow-logo-compact.svg",
    dark: "/brand/estateflow-logo-compact-dark.svg",
    width: 877,
    height: 250,
  },
  symbol: {
    light: "/brand/estateflow-symbol.svg",
    dark: "/brand/estateflow-symbol-dark.svg",
    width: 538,
    height: 611,
  },
} as const;

const LABELS: Record<EstateFlowLogoVariant, string> = {
  full: "EstateFlow — Find, Manage, Grow",
  compact: "EstateFlow",
  symbol: "EstateFlow",
};

interface EstateFlowLogoProps {
  /** `full` includes the tagline, `compact` is symbol + wordmark, `symbol` is the mark only. */
  variant?: EstateFlowLogoVariant;
  /** `auto` follows the active light/dark theme. Use `light`/`dark` on fixed surfaces. */
  tone?: EstateFlowLogoTone;
  /** Rendered height in pixels. Width follows the logo's aspect ratio. */
  height?: number;
  href?: string;
  className?: string;
  /** Accessible name. Set to an empty string when a nearby heading already names the brand. */
  label?: string;
}

/**
 * Shared EstateFlow brand lockup.
 *
 * The supplied brand reference is the source of truth for the symbol, wordmark
 * and tagline. Light and dark variants are dedicated assets rather than CSS
 * filters, so the official blue and navy are never distorted.
 */
export function EstateFlowLogo({
  variant = "compact",
  tone = "auto",
  height,
  href,
  className,
  label = LABELS[variant],
}: EstateFlowLogoProps) {
  const asset = ASSETS[variant];
  const resolvedHeight = height ?? (variant === "symbol" ? 32 : 34);
  const width = Math.round((resolvedHeight * asset.width) / asset.height);
  const alt = label || "";

  const images =
    tone === "auto" ? (
      <>
        <img
          src={asset.light}
          alt={alt}
          width={width}
          height={resolvedHeight}
          className="block h-full w-auto dark:hidden"
          draggable={false}
        />
        <img
          src={asset.dark}
          alt={alt}
          width={width}
          height={resolvedHeight}
          className="hidden h-full w-auto dark:block"
          draggable={false}
        />
      </>
    ) : (
      <img
        src={tone === "dark" ? asset.dark : asset.light}
        alt={alt}
        width={width}
        height={resolvedHeight}
        className="block h-full w-auto"
        draggable={false}
      />
    );

  const content = (
    <span
      className="inline-flex shrink-0 items-center"
      style={{ height: resolvedHeight }}
    >
      {images}
    </span>
  );

  if (!href) {
    return <span className={cn("inline-flex items-center", className)}>{content}</span>;
  }

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sidebar)]",
        className,
      )}
      aria-label={label ? `${label} home` : "EstateFlow home"}
    >
      {content}
    </Link>
  );
}

export function EstateFlowSymbol({
  tone = "auto",
  height = 32,
  className,
  label = "EstateFlow",
}: {
  tone?: EstateFlowLogoTone;
  height?: number;
  className?: string;
  label?: string;
}) {
  return (
    <EstateFlowLogo
      variant="symbol"
      tone={tone}
      height={height}
      className={className}
      label={label}
    />
  );
}

export function EstateFlowAppIcon({
  size = 64,
  className,
  label = "EstateFlow app icon",
}: {
  size?: number;
  className?: string;
  label?: string;
}) {
  return (
    <img
      src="/brand/estateflow-app-icon.svg"
      alt={label}
      width={size}
      height={size}
      className={cn("block shrink-0", className)}
      draggable={false}
    />
  );
}

export function EstateFlowBrandHeader({
  variant = "full",
  height = 40,
  className,
  label,
}: {
  variant?: EstateFlowLogoVariant;
  height?: number;
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn("inline-flex items-center", className)}>
      <EstateFlowLogo
        variant={variant}
        height={height}
        label={label}
      />
    </div>
  );
}
