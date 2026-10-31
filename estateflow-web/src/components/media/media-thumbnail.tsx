"use client";

import { ImageOff, Loader2 } from "lucide-react";

import { cn } from "@/lib/cn";
import { useMediaUrl } from "@/lib/media";

/**
 * Renders a private Storage image. The download URL is fetched on demand and
 * cached for the session, so the metadata list never blocks on Storage.
 */
export function MediaThumbnail({
  storagePath,
  alt,
  className,
  imageClassName,
}: {
  storagePath: string;
  alt: string;
  className?: string;
  imageClassName?: string;
}) {
  const { url, error } = useMediaUrl(storagePath);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-surface-2",
        className,
      )}
    >
      {error ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 p-3 text-center">
          <ImageOff className="h-5 w-5 text-muted" aria-hidden="true" />
          <span className="text-[10px] leading-4 text-muted">
            Preview unavailable
          </span>
        </div>
      ) : url ? (
        // The URL is short-lived and served from Firebase Storage, so a plain
        // image element is deliberate; next/image would not add value here.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={cn("h-full w-full object-cover", imageClassName)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted" aria-hidden="true" />
          <span className="sr-only">Loading image</span>
        </div>
      )}
    </div>
  );
}
