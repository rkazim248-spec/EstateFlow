import { supabase } from "./supabase";
import type { ClientRecord, PropertyRecord, UserProfile } from "./types";

/* -------------------------------------------------------------------------- */
/* Properties                                                                  */
/* -------------------------------------------------------------------------- */

export const PROPERTIES_COLLECTION = "properties";
export const CLIENTS_COLLECTION = "clients";

function toPkr(value: number, unit: string): number {
  switch (unit) {
    case "Thousand Per Month":
      return value * 1000;
    case "Lakh":
      return value * 100000;
    case "Lakh Per Month":
      return value * 100000;
    case "Crore":
      return value * 10000000;
    default:
      return value;
  }
}

export function propertyPayload(values: Record<string, unknown>, uid: string) {
  const price = Number(values.price);
  const priceUnit = values.priceUnit as string;
  return {
    name: (values.name as string).trim(),
    purpose: values.purpose,
    type: values.type,
    bedrooms: values.bedrooms,
    custom_bedrooms: (values.customBedrooms as string).trim(),
    area: Number(values.area),
    area_unit: values.areaUnit,
    price,
    price_unit: priceUnit,
    location: (values.location as string).trim(),
    status: values.status,
    owner_name: (values.ownerName as string).trim(),
    owner_phone: (values.ownerPhone as string).trim(),
    owner_condition: (values.ownerCondition as string).trim(),
    owner_id: uid,
    normalized_price: toPkr(price, priceUnit),
  };
}

export async function createProperty(
  values: Record<string, unknown>,
  uid: string,
): Promise<string> {
  const { data, error } = await supabase
    .from(PROPERTIES_COLLECTION)
    .insert({ ...propertyPayload(values, uid), created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function updateProperty(
  id: string,
  values: Record<string, unknown>,
  uid: string,
): Promise<void> {
  const { error } = await supabase
    .from(PROPERTIES_COLLECTION)
    .update({ ...propertyPayload(values, uid), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteProperty(id: string): Promise<void> {
  const { error } = await supabase.from(PROPERTIES_COLLECTION).delete().eq("id", id);
  if (error) throw error;
}

/* -------------------------------------------------------------------------- */
/* Clients                                                                     */
/* -------------------------------------------------------------------------- */

function clientPayload(values: Record<string, unknown>, uid: string) {
  const budget = Number(values.budget);
  const budgetUnit = values.budgetUnit as string;
  return {
    name: (values.name as string).trim(),
    phone: (values.phone as string).trim(),
    purpose: values.purpose,
    type: values.type,
    bedrooms: values.bedrooms,
    custom_bedrooms: (values.customBedrooms as string).trim(),
    budget,
    budget_unit: budgetUnit,
    location: (values.location as string).trim(),
    requirements: (values.requirements as string).trim(),
    condition: (values.condition as string).trim(),
    status: values.status,
    owner_id: uid,
    normalized_budget: toPkr(budget, budgetUnit),
  };
}

export async function createClient(
  values: Record<string, unknown>,
  uid: string,
): Promise<string> {
  const { data, error } = await supabase
    .from(CLIENTS_COLLECTION)
    .insert({ ...clientPayload(values, uid), created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function updateClient(
  id: string,
  values: Record<string, unknown>,
  uid: string,
): Promise<void> {
  const { error } = await supabase
    .from(CLIENTS_COLLECTION)
    .update({ ...clientPayload(values, uid), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from(CLIENTS_COLLECTION).delete().eq("id", id);
  if (error) throw error;
}

/* -------------------------------------------------------------------------- */
/* Profiles                                                                   */
/* -------------------------------------------------------------------------- */

export async function ensureUserProfile(user: { id: string; email: string | null; user_metadata?: Record<string, unknown> }) {
  const { data: existing } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .insert({
      id: user.id,
      name: (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || "",
      email: user.email || "",
      appearance: "system",
      accent: "teal",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}