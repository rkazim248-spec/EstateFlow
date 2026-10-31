import { PRICE_UNITS, type PriceUnit } from "./constants";

/**
 * Converts a stored amount to PKR.
 *
 * 1 Thousand = 1,000 · 1 Lakh = 100,000 · 1 Crore = 10,000,000.
 * Rental amounts are monthly, so the normalized rent is the monthly figure.
 */
export function toPkr(value: number, unit: PriceUnit | string): number {
  if (!Number.isFinite(value)) return 0;
  switch (unit) {
    case "Thousand Per Month":
      return value * 1_000;
    case "Lakh":
    case "Lakh Per Month":
      return value * 100_000;
    case "Crore":
      return value * 10_000_000;
    default:
      return value;
  }
}

const PRICE_UNIT_SET = new Set<string>(PRICE_UNITS);

export function isPriceUnit(unit: unknown): unit is PriceUnit {
  return typeof unit === "string" && PRICE_UNIT_SET.has(unit);
}

/**
 * South Asian digit grouping (last three digits, then pairs), which is the
 * convention used for Pakistani rupee amounts: 12,50,000.
 */
export function formatNumberPK(value: number, maxFractionDigits = 2): string {
  if (!Number.isFinite(value)) return "0";
  const negative = value < 0;
  const absolute = Math.abs(value);
  const rounded =
    Math.round(absolute * 10 ** maxFractionDigits) / 10 ** maxFractionDigits;
  const fixed = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(maxFractionDigits).replace(/0+$/, "").replace(/\.$/, "");

  const [whole, fraction] = fixed.split(".");
  const lastThree = whole.slice(-3);
  const rest = whole.slice(0, -3);
  const grouped = rest
    ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",")},${lastThree}`
    : lastThree;

  return `${negative ? "-" : ""}${grouped}${fraction ? `.${fraction}` : ""}`;
}

export function formatPkr(value: number): string {
  return `PKR ${formatNumberPK(value)}`;
}

/** Stored amount + unit, e.g. `PKR 85 Lakh`. */
export function formatAmountWithUnit(value: number, unit: string): string {
  return `PKR ${formatNumberPK(value)} ${unit}`;
}

/**
 * Compact, human summary of a normalized PKR amount. Only used as a
 * secondary hint; the exact figure is always shown alongside it.
 */
export function formatPkrCompact(value: number): string {
  if (value >= 10_000_000) {
    const crores = value / 10_000_000;
    return `PKR ${formatNumberPK(crores, 2)} Crore`;
  }
  if (value >= 100_000) {
    const lakhs = value / 100_000;
    return `PKR ${formatNumberPK(lakhs, 2)} Lakh`;
  }
  return formatPkr(value);
}

export function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(date: Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function relativeDate(date: Date | null): string {
  if (!date) return "—";
  const diff = Date.now() - date.getTime();
  const day = 86_400_000;
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  if (diff < day) return `${Math.floor(diff / 3_600_000)} hr ago`;
  if (diff < day * 7) return `${Math.floor(diff / day)} d ago`;
  return formatDate(date);
}

/** Area is stored with its own unit; no silent conversion is applied. */
export function formatArea(value: number, unit: string): string {
  return `${formatNumberPK(value)} ${unit}`;
}
