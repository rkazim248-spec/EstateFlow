import type { DocumentData } from "firebase/firestore";

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
  const priceUnit = isPriceUnit(data.priceUnit)
    ? (data.priceUnit as PriceUnit)
    : "Lakh";
  const storedNormalized = asNumber(data.normalizedPrice, Number.NaN);

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
    customBedrooms: asString(data.customBedrooms),
    area: asNumber(data.area),
    areaUnit: oneOf<AreaUnit>(data.areaUnit, AREA_UNITS, "Marla"),
    price,
    priceUnit,
    location: asString(data.location),
    status: oneOf<PropertyStatus>(
      data.status,
      PROPERTY_STATUSES,
      "Available",
    ),
    ownerName: asString(data.ownerName),
    ownerPhone: asString(data.ownerPhone),
    ownerCondition: asString(data.ownerCondition),
    ownerId: asString(data.ownerId) || null,
    normalizedPrice: Number.isFinite(storedNormalized) && isPriceUnit(data.priceUnit)
      ? toPkr(price, priceUnit)
      : toPkr(price, priceUnit),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

export function mapClient(id: string, data: DocumentData): ClientRecord {
  const budget = asNumber(data.budget);
  const budgetUnit = isPriceUnit(data.budgetUnit)
    ? (data.budgetUnit as PriceUnit)
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
    customBedrooms: asString(data.customBedrooms),
    budget,
    budgetUnit,
    location: asString(data.location),
    requirements: asString(data.requirements),
    condition: asString(data.condition),
    status: oneOf<ClientStatus>(data.status, CLIENT_STATUSES, "New"),
    ownerId: asString(data.ownerId) || null,
    normalizedBudget: toPkr(budget, budgetUnit),
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}
