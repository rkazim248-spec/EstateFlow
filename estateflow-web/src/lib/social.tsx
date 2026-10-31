"use client";

import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

import { DEFAULT_TIME_ZONE, SOCIAL_PLATFORMS } from "./constants";
import { useAuth } from "./auth";
import { describeDataError } from "./errors";
import { getFirebase } from "./firebase";
import { mapSocialPost } from "./mappers";
import { toDate, type SocialPostRecord, type SocialPostStatus } from "./types";

export type SocialTone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

export const SOCIAL_STATUS_ORDER: SocialPostStatus[] = [
  "draft",
  "scheduled",
  "publishing",
  "published",
  "failed",
  "cancelled",
];

export const SOCIAL_STATUS_META: Record<
  SocialPostStatus,
  { label: string; tone: SocialTone; description: string }
> = {
  draft: {
    label: "Draft",
    tone: "neutral",
    description: "Saved locally in Firestore; not queued for publishing.",
  },
  scheduled: {
    label: "Scheduled",
    tone: "info",
    description: "Would be queued for a background worker at the planned time.",
  },
  publishing: {
    label: "Publishing",
    tone: "warning",
    description: "A worker would be attempting delivery to each destination.",
  },
  published: {
    label: "Published",
    tone: "success",
    description: "At least one destination would report a successful publication.",
  },
  failed: {
    label: "Failed",
    tone: "danger",
    description: "A publication attempt would have failed. See the per-destination results.",
  },
  cancelled: {
    label: "Cancelled",
    tone: "neutral",
    description: "A scheduled post that would have been withdrawn before publishing.",
  },
};

/** Flat brand-adjacent colours, used only for the local monogram marks. */
export const PLATFORM_COLORS: Record<string, string> = {
  facebook: "#1877f2",
  instagram: "#b4377c",
  linkedin: "#0a66c2",
  pinterest: "#a8071a",
  tiktok: "#16181c",
  x: "#16181c",
};

export const PLATFORM_MARKS: Record<string, string> = {
  facebook: "f",
  instagram: "ig",
  linkedin: "in",
  pinterest: "p",
  tiktok: "tt",
  x: "x",
};

export function platformName(id: string): string {
  return SOCIAL_PLATFORMS.find((platform) => platform.id === id)?.name ?? id;
}

export function platformRequirement(id: string): string {
  return (
    SOCIAL_PLATFORMS.find((platform) => platform.id === id)?.requirement ??
    "This platform is not supported by the current build."
  );
}

export type SocialResultStatus =
  | "pending"
  | "success"
  | "failed"
  | "rate_limited"
  | "expired_token"
  | "unknown";

export interface SocialResultRecord {
  id: string;
  platform: string;
  accountName: string;
  status: SocialResultStatus;
  message: string;
  externalUrl: string | null;
  attemptedAt: Date | null;
}

const RESULT_STATUSES: readonly SocialResultStatus[] = [
  "pending",
  "success",
  "failed",
  "rate_limited",
  "expired_token",
];

export const SOCIAL_RESULT_META: Record<
  SocialResultStatus,
  { label: string; tone: SocialTone }
> = {
  pending: { label: "Pending", tone: "info" },
  success: { label: "Published", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
  rate_limited: { label: "Rate limited", tone: "warning" },
  expired_token: { label: "Reconnection required", tone: "warning" },
  unknown: { label: "Unknown", tone: "neutral" },
};

export function useSocialPosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<SocialPostRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!user) {
      setPosts([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    const { db } = getFirebase();
    const postsQuery = query(
      collection(db, "users", user.uid, "socialPosts"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      postsQuery,
      (snapshot) => {
        setPosts(
          snapshot.docs.map((document) =>
            mapSocialPost(document.id, document.data()),
          ),
        );
        setLoading(false);
        setError(null);
      },
      (snapshotError) => {
        setPosts([]);
        setLoading(false);
        setError(describeDataError(snapshotError));
      },
    );

    return unsubscribe;
  }, [user, retryKey]);

  return {
    posts,
    loading,
    error,
    retry: () => setRetryKey((key) => key + 1),
  };
}

/**
 * Reads any per-destination publication results written by a future worker.
 * This build never writes them; the UI shows an honest empty state.
 */
export function useSocialResults(postId: string | null) {
  const { user } = useAuth();
  const [results, setResults] = useState<SocialResultRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !postId) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    const { db } = getFirebase();
    const unsubscribe = onSnapshot(
      collection(db, "users", user.uid, "socialPosts", postId, "results"),
      (snapshot) => {
        const mapped = snapshot.docs.map((document) => {
          const data = document.data();
          const status = RESULT_STATUSES.includes(data.status)
            ? (data.status as SocialResultStatus)
            : "unknown";
          return {
            id: document.id,
            platform: typeof data.platform === "string" ? data.platform : "unknown",
            accountName:
              typeof data.accountName === "string" ? data.accountName : "",
            status,
            message: typeof data.message === "string" ? data.message : "",
            externalUrl:
              typeof data.externalUrl === "string" ? data.externalUrl : null,
            attemptedAt: toDate(
              data.attemptedAt ?? data.completedAt ?? data.updatedAt,
            ),
          } satisfies SocialResultRecord;
        });
        setResults(mapped.sort((a, b) => a.platform.localeCompare(b.platform)));
        setLoading(false);
        setError(null);
      },
      (snapshotError) => {
        setResults([]);
        setLoading(false);
        setError(describeDataError(snapshotError));
      },
    );

    return unsubscribe;
  }, [user, postId]);

  return { results, loading, error };
}

/* -------------------------------------------------------------------------- */
/* Scheduling helpers                                                          */
/* -------------------------------------------------------------------------- */

export function formatInTimeZone(date: Date, timeZone = DEFAULT_TIME_ZONE): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone,
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

/**
 * Converts a `datetime-local` wall-clock value in the given zone to an instant.
 * Pakistan has no daylight saving, but the offset is still derived rather than
 * hard-coded so the helper remains correct if the workspace zone changes.
 */
export function zonedDateTimeToUtc(
  value: string,
  timeZone = DEFAULT_TIME_ZONE,
): Date | null {
  if (!value) return null;
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return null;
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  if (![year, month, day, hour, minute].every((part) => Number.isFinite(part))) {
    return null;
  }

  const guess = Date.UTC(year, month - 1, day, hour, minute);
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date(guess));
    const read = (type: string) =>
      Number(parts.find((part) => part.type === type)?.value ?? "0");
    const zoneHour = read("hour") % 24;
    const asUtc = Date.UTC(
      read("year"),
      read("month") - 1,
      read("day"),
      zoneHour,
      read("minute"),
      read("second"),
    );
    const offset = asUtc - guess;
    return new Date(guess - offset);
  } catch {
    return new Date(guess);
  }
}

export function normalizeHashtags(raw: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const token of raw.split(/[\s,]+/)) {
    const cleaned = token.replace(/^#+/, "").replace(/[^\p{L}\p{N}_-]/gu, "").trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(cleaned);
    if (tags.length >= 20) break;
  }
  return tags;
}

export function hashtagString(tags: string[]): string {
  return tags.map((tag) => `#${tag}`).join(" ");
}
