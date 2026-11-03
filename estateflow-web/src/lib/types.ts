import type {
  AreaUnit,
  ClientPurpose,
  ClientStatus,
  PriceUnit,
  PropertyPurpose,
  PropertyStatus,
  PropertyType,
} from "./constants";

/** ISO-ish timestamp that tolerates missing fields on legacy mobile records. */
export type TimestampLike =
  | { toDate: () => Date }
  | Date
  | string
  | number
  | null
  | undefined;

export function toDate(value: TimestampLike): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "object" && typeof value.toDate === "function") {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export interface PropertyRecord {
  id: string;
  name: string;
  purpose: PropertyPurpose;
  type: PropertyType;
  bedrooms: string;
  customBedrooms: string;
  area: number;
  areaUnit: AreaUnit;
  /** Amount in the stored unit (not PKR). */
  price: number;
  priceUnit: PriceUnit;
  location: string;
  status: PropertyStatus;
  ownerName: string;
  ownerPhone: string;
  ownerCondition: string;
  /** Written by the web app; absent on records created by older app builds. */
  ownerId: string | null;
  normalizedPrice: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface ClientRecord {
  id: string;
  name: string;
  phone: string;
  purpose: ClientPurpose;
  type: PropertyType;
  bedrooms: string;
  customBedrooms: string;
  budget: number;
  budgetUnit: PriceUnit;
  location: string;
  requirements: string;
  condition: string;
  status: ClientStatus;
  ownerId: string | null;
  normalizedBudget: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  appearance: "light" | "dark" | "system";
  accent: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}
/** Result of comparing one client against one property. */
export type MatchLabel =
  | "Strong Match"
  | "Possible Match"
  | "Type Mismatch"
  | "Purpose Mismatch"
  | "Does Not Meet Budget"
  | "Location Mismatch";

export interface MatchAssessment {
  label: MatchLabel;
  /** Criteria satisfied out of the five comparable dimensions. */
  score: number;
  maxScore: number;
  reasons: string[];
  blockers: MatchLabel[];
  property: PropertyRecord;
  client: ClientRecord;
}

export function resolvedBedrooms(record: {
  bedrooms: string;
  customBedrooms: string;
}): string {
  return record.bedrooms === "Custom" && record.customBedrooms.trim()
    ? record.customBedrooms.trim()
    : record.bedrooms;
}
