type DocumentData = Record<string, unknown>;

import {
  AREA_UNITS,
  CLIENT_PURPOSES,
  CLIENT_STATUSES,
  PROPERTY_PURPOSES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  type AreaUnit,
  type ClientPurpose,
  type ClientStatus,
  type PriceUnit,
  type PropertyPurpose,
  type PropertyStatus,
  type PropertyType,
} from "./constants";
import { isPriceUnit, toPkr } from "./money";
import {
  toDate,
  type ClientRecord,
  type PropertyRecord,
} from "./types";

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, "").trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/**
 * Maps a `properties` document. Field names match the Flutter app so both
 * clients read and write the same records.
 */
export function mapProperty(id: string, data: DocumentData): PropertyRecord {
  const price = asNumber(data.price);
  const priceUnit = isPriceUnit(data.price_unit)
    ? (data.price_unit as PriceUnit)
    : "Lakh";
  const storedNormalized = asNumber(data.normalized_price, Number.NaN);

  return {
    id,
    name: asString(data.name, "Untitled property"),
    purpose: oneOf<PropertyPurpose>(
      data.purpose,
      PROPERTY_PURPOSES,
      "Sell",
    ),
    type: oneOf<PropertyType>(data.type, PROPERTY_TYPES, "House"),
    bedrooms: asString(data.bedrooms),
    customBedrooms: asString(data.custom_bedrooms),
    area: asNumber(data.area),
    areaUnit: oneOf<AreaUnit>(data.area_unit, AREA_UNITS, "Marla"),
    price,
    priceUnit,
    location: asString(data.location),
    status: oneOf<PropertyStatus>(
      data.status,
      PROPERTY_STATUSES,
      "Available",
    ),
    ownerName: asString(data.owner_name),
    ownerPhone: asString(data.owner_phone),
    ownerCondition: asString(data.owner_condition),
    ownerId: asString(data.owner_id) || null,
    normalizedPrice: Number.isFinite(storedNormalized) && isPriceUnit(data.price_unit)
      ? toPkr(price, priceUnit)
      : toPkr(price, (data.price_unit as string) || "Lakh"),
    createdAt: toDate(data.created_at as never),
    updatedAt: toDate(data.updated_at as never),
  };
}

export function mapClient(id: string, data: DocumentData): ClientRecord {
  const budget = asNumber(data.budget);
  const budgetUnit = isPriceUnit(data.budget_unit)
    ? (data.budget_unit as PriceUnit)
    : "Lakh";

  return {
    id,
    name: asString(data.name, "Unnamed client"),
    phone: asString(data.phone),
    purpose: oneOf<ClientPurpose>(
      data.purpose,
      CLIENT_PURPOSES,
      "Want to Buy",
    ),
    type: oneOf<PropertyType>(data.type, PROPERTY_TYPES, "House"),
    bedrooms: asString(data.bedrooms),
    customBedrooms: asString(data.custom_bedrooms),
    budget,
    budgetUnit: isPriceUnit(data.budget_unit) ? (data.budget_unit as PriceUnit) : "Lakh",
    location: asString(data.location),
    requirements: asString(data.requirements),
    condition: asString(data.condition),
    status: oneOf<ClientStatus>(data.status, CLIENT_STATUSES, "New"),
    ownerId: asString(data.owner_id) || null,
    normalizedBudget: toPkr(budget, budgetUnit),
    createdAt: toDate(data.created_at as never),
    updatedAt: toDate(data.updated_at as never),
  };
}
