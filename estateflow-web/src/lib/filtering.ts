import type { ClientRecord, PropertyRecord } from "./types";
import { resolvedBedrooms } from "./types";

function bedroomCount(label: string): number | null {
  const match = label.match(/^(\d+)/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function textMatch(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.trim().toLowerCase());
}

export type PropertySort =
  | "recent"
  | "name"
  | "price-asc"
  | "price-desc"
  | "updated";

export const PROPERTY_SORT_OPTIONS: Array<{ value: PropertySort; label: string }> = [
  { value: "recent", label: "Recently added" },
  { value: "name", label: "Name (A–Z)" },
  { value: "price-asc", label: "Price (low to high)" },
  { value: "price-desc", label: "Price (high to low)" },
  { value: "updated", label: "Recently updated" },
];

export function isPropertySort(value: string | null): value is PropertySort {
  return PROPERTY_SORT_OPTIONS.some((option) => option.value === value);
}

export interface PropertyFilterState {
  q: string;
  purpose: string;
  type: string;
  status: string;
  location: string;
  bedrooms: string;
  minPrice: string;
  maxPrice: string;
  minArea: string;
  maxArea: string;
  areaUnit: string;
}

export const EMPTY_PROPERTY_FILTERS: PropertyFilterState = {
  q: "",
  purpose: "",
  type: "",
  status: "",
  location: "",
  bedrooms: "",
  minPrice: "",
  maxPrice: "",
  minArea: "",
  maxArea: "",
  areaUnit: "",
};

export function propertyFiltersFromParams(
  params: URLSearchParams,
): PropertyFilterState {
  const read = (key: string) => params.get(key) ?? "";
  return {
    q: read("q"),
    purpose: read("purpose"),
    type: read("type"),
    status: read("status"),
    location: read("location"),
    bedrooms: read("bedrooms"),
    minPrice: read("minPrice"),
    maxPrice: read("maxPrice"),
    minArea: read("minArea"),
    maxArea: read("maxArea"),
    areaUnit: read("areaUnit"),
  };
}

export function filterProperties(
  properties: PropertyRecord[],
  filters: PropertyFilterState,
): PropertyRecord[] {
  const minPrice = filters.minPrice ? Number(filters.minPrice) : null;
  const maxPrice = filters.maxPrice ? Number(filters.maxPrice) : null;
  const minArea = filters.minArea ? Number(filters.minArea) : null;
  const maxArea = filters.maxArea ? Number(filters.maxArea) : null;

  return properties.filter((property) => {
    if (filters.q) {
      const haystack = [
        property.name,
        property.location,
        property.ownerName,
        property.ownerPhone,
        property.type,
        property.purpose,
        property.bedrooms,
        property.customBedrooms,
      ].join(" ");
      if (!textMatch(haystack, filters.q)) return false;
    }
    if (filters.purpose && property.purpose !== filters.purpose) return false;
    if (filters.type && property.type !== filters.type) return false;
    if (filters.status && property.status !== filters.status) return false;
    if (filters.location && !textMatch(property.location, filters.location)) {
      return false;
    }
    if (filters.bedrooms) {
      const wanted = bedroomCount(filters.bedrooms);
      if (wanted !== null) {
        const actual = bedroomCount(resolvedBedrooms(property));
        if (actual !== wanted) return false;
      } else if (property.bedrooms !== filters.bedrooms) {
        return false;
      }
    }
    if (minPrice !== null && property.normalizedPrice < minPrice) return false;
    if (maxPrice !== null && property.normalizedPrice > maxPrice) return false;

    if (filters.areaUnit) {
      if (property.areaUnit !== filters.areaUnit) return false;
      if (minArea !== null && property.area < minArea) return false;
      if (maxArea !== null && property.area > maxArea) return false;
    }
    return true;
  });
}

export function sortProperties(
  properties: PropertyRecord[],
  sort: PropertySort,
): PropertyRecord[] {
  const copy = [...properties];
  switch (sort) {
    case "name":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "price-asc":
      return copy.sort((a, b) => a.normalizedPrice - b.normalizedPrice);
    case "price-desc":
      return copy.sort((a, b) => b.normalizedPrice - a.normalizedPrice);
    case "updated":
      return copy.sort((a, b) => {
        const aTime = a.updatedAt?.getTime() ?? a.createdAt?.getTime() ?? 0;
        const bTime = b.updatedAt?.getTime() ?? b.createdAt?.getTime() ?? 0;
        if (aTime !== bTime) return bTime - aTime;
        return a.name.localeCompare(b.name);
      });
    case "recent":
    default:
      return copy.sort((a, b) => {
        const aTime = a.createdAt?.getTime() ?? 0;
        const bTime = b.createdAt?.getTime() ?? 0;
        if (aTime !== bTime) return bTime - aTime;
        return a.name.localeCompare(b.name);
      });
  }
}

/* -------------------------------------------------------------------------- */
/* Clients                                                                     */
/* -------------------------------------------------------------------------- */

export type ClientSort = "recent" | "name" | "budget-asc" | "budget-desc" | "updated";

export const CLIENT_SORT_OPTIONS: Array<{ value: ClientSort; label: string }> = [
  { value: "recent", label: "Recently added" },
  { value: "name", label: "Name (A–Z)" },
  { value: "budget-asc", label: "Budget (low to high)" },
  { value: "budget-desc", label: "Budget (high to low)" },
  { value: "updated", label: "Recently updated" },
];

export function isClientSort(value: string | null): value is ClientSort {
  return CLIENT_SORT_OPTIONS.some((option) => option.value === value);
}

export interface ClientFilterState {
  q: string;
  purpose: string;
  type: string;
  status: string;
  location: string;
  bedrooms: string;
  minBudget: string;
  maxBudget: string;
}

export const EMPTY_CLIENT_FILTERS: ClientFilterState = {
  q: "",
  purpose: "",
  type: "",
  status: "",
  location: "",
  bedrooms: "",
  minBudget: "",
  maxBudget: "",
};

export function clientFiltersFromParams(params: URLSearchParams): ClientFilterState {
  const read = (key: string) => params.get(key) ?? "";
  return {
    q: read("q"),
    purpose: read("purpose"),
    type: read("type"),
    status: read("status"),
    location: read("location"),
    bedrooms: read("bedrooms"),
    minBudget: read("minBudget"),
    maxBudget: read("maxBudget"),
  };
}

export function filterClients(
  clients: ClientRecord[],
  filters: ClientFilterState,
): ClientRecord[] {
  const minBudget = filters.minBudget ? Number(filters.minBudget) : null;
  const maxBudget = filters.maxBudget ? Number(filters.maxBudget) : null;

  return clients.filter((client) => {
    if (filters.q) {
      const haystack = [
        client.name,
        client.phone,
        client.location,
        client.requirements,
        client.condition,
        client.type,
        client.purpose,
        client.bedrooms,
        client.customBedrooms,
      ].join(" ");
      if (!textMatch(haystack, filters.q)) return false;
    }
    if (filters.purpose && client.purpose !== filters.purpose) return false;
    if (filters.type && client.type !== filters.type) return false;
    if (filters.status && client.status !== filters.status) return false;
    if (filters.location && !textMatch(client.location, filters.location)) {
      return false;
    }
    if (filters.bedrooms) {
      const wanted = bedroomCount(filters.bedrooms);
      if (wanted !== null) {
        const actual = bedroomCount(resolvedBedrooms(client));
        if (actual !== wanted) return false;
      } else if (client.bedrooms !== filters.bedrooms) {
        return false;
      }
    }
    if (minBudget !== null && client.normalizedBudget < minBudget) return false;
    if (maxBudget !== null && client.normalizedBudget > maxBudget) return false;
    return true;
  });
}

export function sortClients(clients: ClientRecord[], sort: ClientSort): ClientRecord[] {
  const copy = [...clients];
  switch (sort) {
    case "name":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "budget-asc":
      return copy.sort((a, b) => a.normalizedBudget - b.normalizedBudget);
    case "budget-desc":
      return copy.sort((a, b) => b.normalizedBudget - a.normalizedBudget);
    case "updated":
      return copy.sort((a, b) => {
        const aTime = a.updatedAt?.getTime() ?? a.createdAt?.getTime() ?? 0;
        const bTime = b.updatedAt?.getTime() ?? b.createdAt?.getTime() ?? 0;
        if (aTime !== bTime) return bTime - aTime;
        return a.name.localeCompare(b.name);
      });
    case "recent":
    default:
      return copy.sort((a, b) => {
        const aTime = a.createdAt?.getTime() ?? 0;
        const bTime = b.createdAt?.getTime() ?? 0;
        if (aTime !== bTime) return bTime - aTime;
        return a.name.localeCompare(b.name);
      });
  }
}

export function countActiveFilters(
  filters: Record<string, string>,
  ignoreKeys: string[] = [],
): number {
  return Object.entries(filters).filter(
    ([key, value]) => !ignoreKeys.includes(key) && value !== "",
  ).length;
}
