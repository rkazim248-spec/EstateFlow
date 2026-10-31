"use client";

import { Heart, MessageCircle, Repeat2, Send } from "lucide-react";

import { MediaThumbnail } from "@/components/media/media-thumbnail";
import { PlatformMark } from "@/components/social/platform-mark";
import { platformName } from "@/lib/social";
import type { MediaRecord } from "@/lib/types";
import { cn } from "@/lib/cn";

const ASPECT_BY_PLATFORM: Record<string, string> = {
  facebook: "aspect-[4/5]",
  instagram: "aspect-square",
  linkedin: "aspect-[16/9]",
  pinterest: "aspect-[2/3]",
  tiktok: "aspect-[9/16]",
  x: "aspect-[16/9]",
};

/**
 * A local layout preview built from the draft's own fields. It does not call a
 * platform API, does not use platform logos, and is explicitly labelled as a
 * preview without a connected account.
 */
export function PostPreview({
  platformId,
  caption,
  hashtags,
  media,
}: {
  platformId: string;
  caption: string;
  hashtags: string[];
  media: MediaRecord | null;
}) {
  const name = platformName(platformId);

  return (
    <article className="min-w-0 overflow-hidden rounded-card border border-border bg-surface">
      <header className="flex items-center gap-2.5 px-3 py-2.5">
        <PlatformMark id={platformId} />
        <div className="min-w-0">
          <p className="truncate text-[11.5px] font-semibold text-ink">{name}</p>
          <p className="truncate text-[9.5px] text-muted">
            Preview · no account connected
          </p>
        </div>
      </header>

      <div className="border-y border-border">
        {media ? (
          <MediaThumbnail
            storagePath={media.storagePath}
            alt={media.name}
            className={cn("w-full", ASPECT_BY_PLATFORM[platformId] ?? "aspect-[4/3]")}
          />
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center bg-surface-2 px-4 text-center">
            <p className="text-[10.5px] leading-5 text-muted">
              No image selected. Some platforms require one before publishing.
            </p>
          </div>
        )}

        <div className="px-3 py-2.5">
          <p className="whitespace-pre-wrap text-[11.5px] leading-5 text-ink-2">
            {caption.trim() || "Your caption will appear here."}
          </p>
          {hashtags.length > 0 ? (
            <p className="mt-1 break-words text-[11px] font-medium leading-5 text-accent">
              {hashtags.map((tag) => `#${tag}`).join(" ")}
            </p>
          ) : null}
        </div>
      </div>

      <footer className="flex items-center gap-4 px-3 py-2 text-muted">
        <span className="inline-flex items-center gap-1 text-[9.5px]">
          <Heart className="h-3.5 w-3.5" aria-hidden="true" />
          Like
        </span>
        <span className="inline-flex items-center gap-1 text-[9.5px]">
          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
          Comment
        </span>
        <span className="inline-flex items-center gap-1 text-[9.5px]">
          <Repeat2 className="h-3.5 w-3.5" aria-hidden="true" />
          Repost
        </span>
        <span className="ml-auto inline-flex items-center gap-1 text-[9.5px]">
          <Send className="h-3.5 w-3.5" aria-hidden="true" />
          Share
        </span>
      </footer>
    </article>
  );
}
