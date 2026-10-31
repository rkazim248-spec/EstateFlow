import type { User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

import {
  CLIENT_PURPOSES,
  PROPERTY_PURPOSES,
  PROPERTY_STATUSES,
  CLIENT_STATUSES,
  typeUsesBedrooms,
  type ClientPurpose,
  type ClientStatus,
  type PriceUnit,
  type PropertyPurpose,
  type PropertyStatus,
  type PropertyType,
} from "./constants";
import { getFirebase } from "./firebase";
import { toPkr } from "./money";
import type { ClientFormValues, PropertyFormValues } from "./validation";
import type { MediaRecord, SocialPostStatus, UserProfile } from "./types";

export const PROPERTIES_COLLECTION = "properties";
export const CLIENTS_COLLECTION = "clients";
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function propertyPayload(values: PropertyFormValues, uid: string) {
  const price = Number(values.price);
  const usesBedrooms = typeUsesBedrooms(values.type);

  return {
    name: values.name.trim(),
    purpose: values.purpose,
    type: values.type,
    bedrooms: usesBedrooms ? values.bedrooms : "",
    customBedrooms:
      usesBedrooms && values.bedrooms === "Custom"
        ? values.customBedrooms.trim()
        : "",
    area: Number(values.area),
    areaUnit: values.areaUnit,
    price,
    priceUnit: values.priceUnit,
    normalizedPrice: toPkr(price, values.priceUnit),
    location: values.location.trim(),
    status: values.status,
    ownerName: values.ownerName.trim(),
    ownerPhone: values.ownerPhone.trim(),
    ownerCondition: values.ownerCondition.trim(),
    ownerId: uid,
  };
}

export async function createProperty(
  values: PropertyFormValues,
  uid: string,
): Promise<string> {
  const { db } = getFirebase();
  const created = await addDoc(collection(db, PROPERTIES_COLLECTION), {
    ...propertyPayload(values, uid),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return created.id;
}

export async function updateProperty(
  id: string,
  values: PropertyFormValues,
  uid: string,
): Promise<void> {
  const { db } = getFirebase();
  await updateDoc(doc(db, PROPERTIES_COLLECTION, id), {
    ...propertyPayload(values, uid),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProperty(id: string): Promise<void> {
  const { db } = getFirebase();
  await deleteDoc(doc(db, PROPERTIES_COLLECTION, id));
}

function clientPayload(values: ClientFormValues, uid: string) {
  const budget = Number(values.budget);
  const usesBedrooms = typeUsesBedrooms(values.type);

  return {
    name: values.name.trim(),
    phone: values.phone.trim(),
    purpose: values.purpose,
    type: values.type,
    bedrooms: usesBedrooms ? values.bedrooms : "",
    customBedrooms:
      usesBedrooms && values.bedrooms === "Custom"
        ? values.customBedrooms.trim()
        : "",
    budget,
    budgetUnit: values.budgetUnit,
    normalizedBudget: toPkr(budget, values.budgetUnit),
    location: values.location.trim(),
    requirements: values.requirements.trim(),
    condition: values.condition.trim(),
    status: values.status,
    ownerId: uid,
  };
}

export async function createClient(
  values: ClientFormValues,
  uid: string,
): Promise<string> {
  const { db } = getFirebase();
  const created = await addDoc(collection(db, CLIENTS_COLLECTION), {
    ...clientPayload(values, uid),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return created.id;
}

export async function updateClient(
  id: string,
  values: ClientFormValues,
  uid: string,
): Promise<void> {
  const { db } = getFirebase();
  await updateDoc(doc(db, CLIENTS_COLLECTION, id), {
    ...clientPayload(values, uid),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteClient(id: string): Promise<void> {
  const { db } = getFirebase();
  await deleteDoc(doc(db, CLIENTS_COLLECTION, id));
}

/* -------------------------------------------------------------------------- */
/* Profile                                                                     */
/* -------------------------------------------------------------------------- */

function normaliseAppearance(value: unknown): UserProfile["appearance"] {
  return value === "light" || value === "dark" || value === "system"
    ? value
    : "system";
}

/**
 * Returns the `users/{uid}` profile, creating a minimal one on first sign-in.
 * Throws only on real failures; callers may continue without a profile.
 */
export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const { db } = getFirebase();
  const reference = doc(db, "users", user.uid);
  const snapshot = await getDoc(reference);

  if (snapshot.exists()) {
    const data = snapshot.data();
    const name =
      typeof data.name === "string" && data.name.trim()
        ? data.name
        : user.displayName ?? user.email?.split("@")[0] ?? "EstateFlow user";
    const email =
      typeof data.email === "string" && data.email ? data.email : user.email ?? "";

    // Repair profiles created before a display name was available.
    if (!data.name || !data.email) {
      await setDoc(
        reference,
        { name, email, updatedAt: serverTimestamp() },
        { merge: true },
      );
    }

    return {
      uid: user.uid,
      name,
      email,
      appearance: normaliseAppearance(data.appearance),
      accent: typeof data.accent === "string" ? data.accent : "teal",
      createdAt: null,
      updatedAt: null,
    };
  }

  const initial = {
    name: user.displayName ?? user.email?.split("@")[0] ?? "EstateFlow user",
    email: user.email ?? "",
    appearance: "system" as const,
    accent: "teal",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(reference, initial);

  return {
    uid: user.uid,
    name: initial.name,
    email: initial.email,
    appearance: initial.appearance,
    accent: initial.accent,
    createdAt: null,
    updatedAt: null,
  };
}

export async function updateUserProfile(
  uid: string,
  patch: Partial<Pick<UserProfile, "name" | "appearance" | "accent">>,
): Promise<void> {
  const { db } = getFirebase();
  await setDoc(
    doc(db, "users", uid),
    { ...patch, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/* -------------------------------------------------------------------------- */
/* Media                                                                       */
/* -------------------------------------------------------------------------- */

function extensionFor(contentType: string): string {
  if (contentType.includes("jpeg")) return "jpg";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "png";
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface UploadOptions {
  propertyId?: string | null;
  source?: "upload" | "ai";
  prompt?: string | null;
  caption?: string | null;
  name?: string;
  onProgress?: (percent: number) => void;
}

export async function uploadMedia(
  blob: Blob,
  uid: string,
  options: UploadOptions = {},
): Promise<MediaRecord> {
  if (!blob.type.startsWith("image/")) {
    throw new Error("Only image files can be added to the media library.");
  }
  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error("Images must be 10 MB or smaller.");
  }

  const { db, storage } = getFirebase();
  const id = randomId();
  const contentType = blob.type || "image/png";
  const storagePath = `users/${uid}/media/${id}.${extensionFor(contentType)}`;
  const storageRef = ref(storage, storagePath);
  const task = uploadBytesResumable(storageRef, blob, { contentType });

  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (snapshot) => {
        if (snapshot.totalBytes > 0) {
          options.onProgress?.(
            Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
          );
        }
      },
      reject,
      () => resolve(),
    );
  });

  const name =
    options.name?.trim() ||
    (options.source === "ai" ? "AI concept" : "Uploaded image");
  const createdAt = new Date();

  const created = await addDoc(collection(db, "users", uid, "media"), {
    name,
    storagePath,
    contentType,
    size: blob.size,
    propertyId: options.propertyId ?? null,
    source: options.source ?? "upload",
    prompt: options.prompt ?? null,
    caption: options.caption ?? null,
    createdAt: serverTimestamp(),
  });

  return {
    id: created.id,
    name,
    storagePath,
    contentType,
    size: blob.size,
    width: null,
    height: null,
    propertyId: options.propertyId ?? null,
    source: options.source ?? "upload",
    prompt: options.prompt ?? null,
    caption: options.caption ?? null,
    createdAt,
  };
}

export async function getMediaUrl(storagePath: string): Promise<string> {
  const { storage } = getFirebase();
  return getDownloadURL(ref(storage, storagePath));
}

export async function deleteMedia(
  uid: string,
  media: Pick<MediaRecord, "id" | "storagePath">,
): Promise<void> {
  const { db, storage } = getFirebase();
  try {
    await deleteObject(ref(storage, media.storagePath));
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code !== "storage/object-not-found") throw error;
  }
  await deleteDoc(doc(db, "users", uid, "media", media.id));
}

/* -------------------------------------------------------------------------- */
/* Social drafts                                                               */
/* -------------------------------------------------------------------------- */

export async function createSocialDraft(
  uid: string,
  input: {
    caption: string;
    hashtags: string;
    mediaId: string | null;
    mediaUrl: string | null;
    destinations: string[];
    status?: SocialPostStatus;
    scheduledFor?: Date | null;
    timeZone: string;
  },
): Promise<string> {
  const { db } = getFirebase();
  const created = await addDoc(collection(db, "users", uid, "socialPosts"), {
    caption: input.caption.trim(),
    hashtags: input.hashtags.trim(),
    mediaId: input.mediaId,
    mediaUrl: input.mediaUrl,
    destinations: input.destinations,
    status: input.status ?? "draft",
    scheduledFor: input.scheduledFor ?? null,
    timeZone: input.timeZone,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return created.id;
}

export async function deleteSocialPost(uid: string, id: string): Promise<void> {
  const { db } = getFirebase();
  await deleteDoc(doc(db, "users", uid, "socialPosts", id));
}

/**
 * The type helpers below keep the form's string unions in sync with the
 * values written to Firestore. They are intentionally no-ops at runtime.
 */
export type StoredPropertyShape = {
  purpose: PropertyPurpose;
  type: PropertyType;
  status: PropertyStatus;
  priceUnit: PriceUnit;
};

export type StoredClientShape = {
  purpose: ClientPurpose;
  type: PropertyType;
  status: ClientStatus;
  budgetUnit: PriceUnit;
};

export const SCHEMA_VALUES = {
  purposes: PROPERTY_PURPOSES,
  statuses: PROPERTY_STATUSES,
  clientPurposes: CLIENT_PURPOSES,
  clientStatuses: CLIENT_STATUSES,
};
