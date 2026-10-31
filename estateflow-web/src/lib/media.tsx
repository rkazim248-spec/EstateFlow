"use client";

import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

import { useAuth } from "./auth";
import { describeDataError, describeStorageError } from "./errors";
import { getFirebase } from "./firebase";
import { mapMedia } from "./mappers";
import { getMediaUrl } from "./data";
import type { MediaRecord } from "./types";

/**
 * Live media metadata for the signed-in user. Binaries live in Cloud Storage;
 * only the object path is kept in Firestore.
 */
export function useMediaLibrary() {
  const { user } = useAuth();
  const [media, setMedia] = useState<MediaRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!user) {
      setMedia([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    const { db } = getFirebase();
    const mediaQuery = query(
      collection(db, "users", user.uid, "media"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      mediaQuery,
      (snapshot) => {
        setMedia(
          snapshot.docs.map((document) => mapMedia(document.id, document.data())),
        );
        setLoading(false);
        setError(null);
      },
      (snapshotError) => {
        setMedia([]);
        setLoading(false);
        setError(describeDataError(snapshotError));
      },
    );

    return unsubscribe;
  }, [user, retryKey]);

  return {
    media,
    loading,
    error,
    retry: () => setRetryKey((key) => key + 1),
  };
}

const urlCache = new Map<string, string>();

/** Resolves a Storage object path to a temporary download URL. */
export function useMediaUrl(storagePath: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(() =>
    storagePath ? urlCache.get(storagePath) ?? null : null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storagePath) {
      setUrl(null);
      setError(null);
      return;
    }

    const cached = urlCache.get(storagePath);
    if (cached) {
      setUrl(cached);
      setError(null);
      return;
    }

    let active = true;
    setError(null);
    getMediaUrl(storagePath)
      .then((resolved) => {
        if (!active) return;
        urlCache.set(storagePath, resolved);
        setUrl(resolved);
      })
      .catch((resolveError) => {
        if (!active) return;
        setError(describeStorageError(resolveError));
      });

    return () => {
      active = false;
    };
  }, [storagePath]);

  return { url, error };
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Triggers a download, falling back to opening the URL in a new tab. */
export async function downloadFromUrl(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Download failed (${response.status}).`);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
