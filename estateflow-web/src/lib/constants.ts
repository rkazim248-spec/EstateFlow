/**
 * Shared vocabulary. The string values are the canonical schema — they are
 * written verbatim to the same Firestore collections the Flutter app uses.
 */

export const PROPERTY_PURPOSES = ["Rent", "Sell"] as const;
export type PropertyPurpose = (typeof PROPERTY_PURPOSES)[number];

export const PROPERTY_TYPES = [
  "Apartment",
  "House",
  "Plot",
  "Shop",
  "Office",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_STATUSES = [
  "Available",
  "Rented",
  "Sold",
  "Not Available",
] as const;
export type PropertyStatus = (typeof PROPERTY_STATUSES)[number];

export const AREA_UNITS = ["Marla", "Kanal", "Sqft", "Sqyd", "Acre"] as const;
export type AreaUnit = (typeof AREA_UNITS)[number];

export const AREA_UNIT_LABELS: Record<AreaUnit, string> = {
  Marla: "Marla",
  Kanal: "Kanal",
  Sqft: "Square Feet",
  Sqyd: "Square Yard",
  Acre: "Acres",
};

export const BEDROOM_OPTIONS = [
  "2 Bed D/D",
  "3 Bed D/D",
  "4 Bed D/D",
  "5 Bed D/D",
  "Custom",
] as const;

export const CLIENT_PURPOSES = ["Want to Buy", "Want to Rent"] as const;
export type ClientPurpose = (typeof CLIENT_PURPOSES)[number];

export const CLIENT_STATUSES = [
  "New",
  "Contacted",
  "Negotiating",
  "Closed",
  "Lost",
] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const SELL_PRICE_UNITS = ["Lakh", "Crore"] as const;
export const RENT_PRICE_UNITS = [
  "Thousand Per Month",
  "Lakh Per Month",
] as const;
export type PriceUnit =
  | (typeof SELL_PRICE_UNITS)[number]
  | (typeof RENT_PRICE_UNITS)[number];

export const PRICE_UNITS = [
  ...SELL_PRICE_UNITS,
  ...RENT_PRICE_UNITS,
] as const;

/** Price units valid for a property purpose. Never mix sale and rent units. */
export function priceUnitsForPurpose(
  purpose: PropertyPurpose | string,
): readonly PriceUnit[] {
  return purpose === "Sell" ? SELL_PRICE_UNITS : RENT_PRICE_UNITS;
}

/** Budget units valid for a client purpose. */
export function budgetUnitsForPurpose(
  purpose: ClientPurpose | string,
): readonly PriceUnit[] {
  return purpose === "Want to Buy" ? SELL_PRICE_UNITS : RENT_PRICE_UNITS;
}

/** Property types that have no meaningful bedroom configuration. */
export const TYPES_WITHOUT_BEDROOMS: readonly PropertyType[] = [
  "Plot",
  "Shop",
  "Office",
];

export function typeUsesBedrooms(type: PropertyType | string): boolean {
  return !TYPES_WITHOUT_BEDROOMS.includes(type as PropertyType);
}

export interface AccentDefinition {
  id: string;
  name: string;
  hint: string;
}

/**
 * Accent palette. Hex values live in globals.css under
 * `html[data-accent="…"]`; this list only drives the picker.
 */
export const ACCENTS: AccentDefinition[] = [
  { id: "teal", name: "Teal", hint: "Calm and professional" },
  { id: "indigo", name: "Indigo", hint: "Confident and clear" },
  { id: "violet", name: "Violet", hint: "Creative and modern" },
  { id: "cyan", name: "Cyan", hint: "Bright and precise" },
  { id: "terracotta", name: "Terracotta", hint: "Warm and grounded" },
  { id: "forest", name: "Forest", hint: "Earthy and steady" },
];

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/properties", label: "Properties", icon: "properties" },
  { href: "/clients", label: "Clients", icon: "clients" },
  { href: "/settings", label: "Settings", icon: "settings" },
] as const;

export const DEFAULT_TIME_ZONE = "Asia/Karachi";


