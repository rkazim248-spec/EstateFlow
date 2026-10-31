import { formatPkr } from "./money";
import type {
  ClientRecord,
  MatchAssessment,
  MatchLabel,
  PropertyRecord,
} from "./types";
import { resolvedBedrooms } from "./types";

function bedroomCount(label: string): number | null {
  const match = label.trim().match(/^(\d+)/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function normaliseText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Location check: either side containing the other counts as compatible. */
export function locationMatches(
  propertyLocation: string,
  clientLocation: string,
): boolean {
  const property = normaliseText(propertyLocation);
  const client = normaliseText(clientLocation);
  if (!property || !client) return true; // nothing to compare against
  return property.includes(client) || client.includes(property);
}

export interface BedroomComparison {
  compatible: boolean;
  /** True when either side uses a free-text custom requirement. */
  indeterminate: boolean;
  reason: string;
}

export function compareBedrooms(
  property: PropertyRecord,
  client: ClientRecord,
): BedroomComparison {
  const propertyBedrooms = resolvedBedrooms(property);
  const clientBedrooms = resolvedBedrooms(client);

  if (!propertyBedrooms || !clientBedrooms) {
    return {
      compatible: true,
      indeterminate: true,
      reason: "No bedroom requirement was recorded on both sides.",
    };
  }
  if (
    property.bedrooms === "Custom" ||
    client.bedrooms === "Custom" ||
    propertyBedrooms === clientBedrooms
  ) {
    if (propertyBedrooms === clientBedrooms) {
      return {
        compatible: true,
        indeterminate: false,
        reason: `Bedrooms: both are "${propertyBedrooms}".`,
      };
    }
    if (property.bedrooms === "Custom" || client.bedrooms === "Custom") {
      return {
        compatible: true,
        indeterminate: true,
        reason: `Custom bedroom requirement "${clientBedrooms}" versus property "${propertyBedrooms}" — confirm details.`,
      };
    }
  }

  const propertyCount = bedroomCount(propertyBedrooms);
  const clientCount = bedroomCount(clientBedrooms);
  if (propertyCount !== null && clientCount !== null) {
    return {
      compatible: propertyCount === clientCount,
      indeterminate: false,
      reason:
        propertyCount === clientCount
          ? `Both have ${propertyCount} bedrooms.`
          : `Client wants ${clientCount} bedrooms; property has ${propertyCount}.`,
    };
  }

  return {
    compatible: true,
    indeterminate: true,
    reason: `Bedroom formats differ ("${clientBedrooms}" vs "${propertyBedrooms}") — confirm with the client.`,
  };
}

export function purposeMatches(
  property: PropertyRecord,
  client: ClientRecord,
): boolean {
  return (
    (property.purpose === "Rent" && client.purpose === "Want to Rent") ||
    (property.purpose === "Sell" && client.purpose === "Want to Buy")
  );
}

/**
 * Compares a property and a client on real stored values. Nothing here is
 * inferred, scored by a model, or treated as a transaction.
 */
export function assessMatch(
  property: PropertyRecord,
  client: ClientRecord,
): MatchAssessment {
  const reasons: string[] = [];
  const blockers: MatchLabel[] = [];
  let score = 0;

  // 1. Purpose
  if (purposeMatches(property, client)) {
    score += 1;
    reasons.push(
      property.purpose === "Rent"
        ? "Rental listing and the client wants to rent."
        : "Sale listing and the client wants to buy.",
    );
  } else {
    blockers.push("Purpose Mismatch");
    reasons.push(
      property.purpose === "Rent"
        ? "The property is for rent, but the client wants to buy."
        : "The property is for sale, but the client wants to rent.",
    );
  }

  // 2. Property type
  if (property.type === client.type) {
    score += 1;
    reasons.push(`Both are ${property.type.toLowerCase()} records.`);
  } else {
    blockers.push("Type Mismatch");
    reasons.push(
      `Client prefers ${client.type.toLowerCase()}, but this is a ${property.type.toLowerCase()}.`,
    );
  }

  // 3. Budget against the normalized monthly/total PKR price
  if (property.normalizedPrice <= client.normalizedBudget) {
    score += 1;
    reasons.push(
      `Budget of ${formatPkr(client.normalizedBudget)} covers the price of ${formatPkr(property.normalizedPrice)}.`,
    );
  } else {
    blockers.push("Does Not Meet Budget");
    reasons.push(
      `Price of ${formatPkr(property.normalizedPrice)} is above the budget of ${formatPkr(client.normalizedBudget)}.`,
    );
  }

  // 4. Location
  if (locationMatches(property.location, client.location)) {
    score += 1;
    reasons.push(
      property.location && client.location
        ? `Location preference "${client.location}" matches "${property.location}".`
        : "No conflicting location preference was recorded.",
    );
  } else {
    blockers.push("Location Mismatch");
    reasons.push(
      `Client prefers "${client.location}", but the property is in "${property.location}".`,
    );
  }

  // 5. Bedrooms
  const bedrooms = compareBedrooms(property, client);
  if (bedrooms.compatible) {
    score += 1;
  } else {
    blockers.push("Possible Match");
  }
  reasons.push(bedrooms.reason);

  let label: MatchLabel;
  if (blockers.includes("Purpose Mismatch")) label = "Purpose Mismatch";
  else if (blockers.includes("Type Mismatch")) label = "Type Mismatch";
  else if (blockers.includes("Does Not Meet Budget")) label = "Does Not Meet Budget";
  else if (blockers.includes("Location Mismatch")) label = "Location Mismatch";
  else if (score === 5 && !bedrooms.indeterminate) label = "Strong Match";
  else label = "Possible Match";

  return {
    label,
    score,
    maxScore: 5,
    reasons,
    blockers,
    property,
    client,
  };
}

export function matchesForProperty(
  property: PropertyRecord,
  clients: ClientRecord[],
): MatchAssessment[] {
  return clients
    .map((client) => assessMatch(property, client))
    .sort((a, b) => b.score - a.score);
}

export function matchesForClient(
  client: ClientRecord,
  properties: PropertyRecord[],
): MatchAssessment[] {
  return properties
    .map((property) => assessMatch(property, client))
    .sort((a, b) => b.score - a.score);
}

export function isPositiveMatch(label: MatchLabel): boolean {
  return label === "Strong Match" || label === "Possible Match";
}

export const MATCH_LABEL_TONE: Record<
  MatchLabel,
  "success" | "info" | "warning" | "danger" | "neutral"
> = {
  "Strong Match": "success",
  "Possible Match": "info",
  "Type Mismatch": "warning",
  "Purpose Mismatch": "danger",
  "Does Not Meet Budget": "warning",
  "Location Mismatch": "warning",
};
