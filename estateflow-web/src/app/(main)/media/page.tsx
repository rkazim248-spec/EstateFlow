"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Download,
  Image as ImageIcon,
  Images,
  Link2,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";

import { MediaThumbnail } from "@/components/media/media-thumbnail";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  InlineNotice,
  Input,
  Modal,
  PageHeader,
  SegmentedControl,
  Skeleton,
  buttonClasses,
  useToast,
} from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data-context";
import {
  MAX_UPLOAD_BYTES,
  deleteMedia,
  getMediaUrl,
  uploadMedia,
} from "@/lib/data";
import { describeStorageError } from "@/lib/errors";
import {
  downloadFromUrl,
  formatBytes,
  useMediaLibrary,
} from "@/lib/media";
import { formatDateTime } from "@/lib/money";
import type { MediaRecord } from "@/lib/types";
import { cn } from "@/lib/cn";

type SourceFilter = "all" | "upload" | "ai";

function extensionFor(contentType: string): string {
  if (contentType.includes("jpeg")) return "jpg";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "png";
}

export default function MediaLibraryPage() {
  const { user } = useAuth();
  const { media, loading, error, retry } = useMediaLibrary();
  const { properties } = useData();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [source, setSource] = useState<SourceFilter>("all");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MediaRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const propertyById = useMemo(
    () => new Map((properties ?? []).map((property) => [property.id, property])),
    [properties],
  );

  const list = media ?? [];
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return list.filter((record) => {
      if (source !== "all" && record.source !== source) return false;
      if (!query) return true;
      return (
        record.name.toLowerCase().includes(query) ||
        (record.prompt ?? "").toLowerCase().includes(query) ||
        (record.caption ?? "").toLowerCase().includes(query)
      );
    });
  }, [list, search, source]);

  const preview = previewId
    ? list.find((record) => record.id === previewId) ?? null
    : null;

  useEffect(() => {
    if (previewId && !preview && !loading) setPreviewId(null);
  }, [previewId, preview, loading]);

  const totalBytes = list.reduce((total, record) => total + record.size, 0);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !user || uploading) return;

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "error",
        title: "Only images can be uploaded",
        description: "Choose a PNG, JPG, WebP or GIF file.",
      });
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast({
        variant: "error",
        title: "That image is too large",
        description: "The limit is 10 MB per image.",
      });
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      await uploadMedia(file, user.uid, {
        name: file.name.replace(/\.[^.]+$/, "").trim() || file.name,
        onProgress: setProgress,
      });
      toast({
        variant: "success",
        title: "Image added",
        description: "It is now in your private media library.",
      });
    } catch (uploadError) {
      toast({
        variant: "error",
        title: "Upload failed",
        description: describeStorageError(uploadError),
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  async function handleDownload(record: MediaRecord) {
    try {
      const url = await getMediaUrl(record.storagePath);
      await downloadFromUrl(
        url,
        `${record.name.replace(/[\\/:*?"<>|]+/g, "-")}.${extensionFor(record.contentType)}`,
      );
    } catch (downloadError) {
      toast({
        variant: "error",
        title: "Could not download this image",
        description: describeStorageError(downloadError),
      });
    }
  }

  async function handleDelete() {
    if (!pendingDelete || !user || deleting) return;
    setDeleting(true);
    try {
      await deleteMedia(user.uid, pendingDelete);
      toast({ variant: "success", title: "Image deleted" });
      if (previewId === pendingDelete.id) setPreviewId(null);
      setPendingDelete(null);
    } catch (deleteError) {
      toast({
        variant: "error",
        title: "Could not delete this image",
        description: describeStorageError(deleteError),
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Assets"
        title="Media Library"
        description="Images you upload or generate, stored privately in Cloud Storage. Firestore keeps only metadata, and every preview is loaded on demand."
        actions={
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              onChange={handleFile}
              aria-label="Upload an image"
            />
            <Link
              href="/ai-studio"
              className={buttonClasses("secondary", "md")}
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              AI Studio
            </Link>
            <Button
              icon={<Plus className="h-4 w-4" aria-hidden="true" />}
              loading={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload image
            </Button>
          </>
        }
      />

      {error ? (
        <div className="mb-5">
          <InlineNotice
            tone="warning"
            title="Media library unavailable"
            action={
              <Button variant="secondary" size="sm" onClick={retry}>
                Retry
              </Button>
            }
          >
            {error} Deploy the Storage rules and the{" "}
            <code className="rounded bg-surface-2 px-1 py-0.5 text-[11px]">
              users/&#123;uid&#125;
            </code>{" "}
            Firestore rules described in the README.
          </InlineNotice>
        </div>
      ) : null}

      {uploading ? (
        <div className="mb-4 rounded-card border border-border bg-surface px-4 py-3">
          <div className="flex items-center justify-between gap-3 text-[12px]">
            <span className="inline-flex items-center gap-2 font-medium text-ink">
              <UploadCloud className="h-4 w-4 text-accent" aria-hidden="true" />
              Uploading image…
            </span>
            <span className="tnum text-muted">{progress}%</span>
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label="Upload progress"
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-200"
              style={{ width: `${Math.max(progress, 2)}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted">
            Keep this tab open until the upload finishes. Files are capped at 10 MB.
          </p>
        </div>
      ) : null}

      <Card className="mb-4 p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1 lg:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search names, prompts or captions"
              className="pl-9"
              aria-label="Search media"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SegmentedControl<SourceFilter>
              value={source}
              onChange={setSource}
              ariaLabel="Filter by source"
              size="sm"
              options={[
                { value: "all", label: "All" },
                { value: "upload", label: "Uploads" },
                { value: "ai", label: "AI concepts" },
              ]}
            />
            <p className="text-[11px] text-muted tnum">
              {filtered.length} of {list.length} · {formatBytes(totalBytes)}
            </p>
          </div>
        </div>
      </Card>

      {loading && list.length === 0 ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Skeleton key={index} className="aspect-[4/3] w-full rounded-card" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Images className="h-5 w-5" aria-hidden="true" />}
          title="No images yet"
          description="Upload a photo for a listing, or generate a concept in AI Studio. Saved images appear here with their property link and date."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                icon={<UploadCloud className="h-4 w-4" aria-hidden="true" />}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload image
              </Button>
              <Link href="/ai-studio" className={buttonClasses("secondary", "md")}>
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Open AI Studio
              </Link>
            </div>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="h-5 w-5" aria-hidden="true" />}
          title="No images match"
          description="Try a different search term or switch the source filter."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setSearch("");
                setSource("all");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((record) => {
            const property = record.propertyId
              ? propertyById.get(record.propertyId)
              : null;
            return (
              <li key={record.id} className="min-w-0">
                <Card className="group flex h-full flex-col overflow-hidden transition-colors hover:border-border-strong">
                  <button
                    type="button"
                    onClick={() => setPreviewId(record.id)}
                    className="relative block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]"
                    aria-label={`Preview ${record.name}`}
                  >
                    <MediaThumbnail
                      storagePath={record.storagePath}
                      alt={record.name}
                      className="aspect-[4/3] w-full"
                      imageClassName="transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-medium leading-4 text-white">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          record.source === "ai" ? "bg-white" : "bg-white/70",
                        )}
                        aria-hidden="true"
                      />
                      {record.source === "ai" ? "Concept" : "Upload"}
                    </span>
                  </button>
                  <div className="flex flex-1 flex-col gap-1.5 p-3">
                    <p className="truncate text-[12.5px] font-medium text-ink" title={record.name}>
                      {record.name}
                    </p>
                    <p className="text-[10.5px] text-muted tnum">
                      {record.createdAt ? formatDateTime(record.createdAt) : "Date unavailable"}
                    </p>
                    {property ? (
                      <Link
                        href={`/properties/${property.id}`}
                        className="inline-flex min-w-0 items-center gap-1 text-[10.5px] font-medium text-accent underline-offset-4 hover:underline"
                      >
                        <Link2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <span className="truncate">{property.name}</span>
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10.5px] text-muted">
                        <Link2 className="h-3 w-3" aria-hidden="true" />
                        Not linked
                      </span>
                    )}
                    <div className="mt-auto flex items-center justify-between gap-1 pt-2">
                      <button
                        type="button"
                        onClick={() => setPreviewId(record.id)}
                        className="rounded px-1 py-0.5 text-[10.5px] font-medium text-accent underline-offset-4 hover:underline"
                      >
                        View
                      </button>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => void handleDownload(record)}
                          className="grid h-7 w-7 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                          aria-label={`Download ${record.name}`}
                          title="Download"
                        >
                          <Download className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(record)}
                          className="grid h-7 w-7 place-items-center rounded-md text-muted transition-colors hover:bg-danger-soft hover:text-danger"
                          aria-label={`Delete ${record.name}`}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={Boolean(preview)}
        onClose={() => setPreviewId(null)}
        title={preview?.name ?? "Image"}
        description={
          preview
            ? preview.source === "ai"
              ? "AI-generated concept, not a photograph of the property."
              : "Uploaded image stored in your private media library."
            : undefined
        }
        size="lg"
        footer={
          preview ? (
            <>
              <Button
                variant="danger"
                icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                onClick={() => setPendingDelete(preview)}
                disabled={deleting}
              >
                Delete
              </Button>
              <Button
                variant="secondary"
                icon={<Download className="h-4 w-4" aria-hidden="true" />}
                onClick={() => void handleDownload(preview)}
              >
                Download
              </Button>
              <Link
                href={`/social?media=${preview.id}`}
                className={buttonClasses("primary", "md")}
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                Use in social post
              </Link>
            </>
          ) : null
        }
      >
        {preview ? (
          <div className="space-y-4">
            <MediaThumbnail
              storagePath={preview.storagePath}
              alt={preview.name}
              className="h-[min(46vh,420px)] w-full rounded-card border border-border"
              imageClassName="object-contain"
            />

            {preview.source === "ai" ? (
              <InlineNotice tone="info" title="Concept image">
                This was generated from a text prompt. It is not a photo of a real
                property and should be labelled as a concept wherever it is used.
              </InlineNotice>
            ) : null}

            <dl className="grid gap-x-6 gap-y-3 text-[12.5px] sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
                    Added
                  </dt>
                  <dd className="mt-0.5 text-ink">
                    {preview.createdAt ? formatDateTime(preview.createdAt) : "Unknown"}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <ImageIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
                    File
                  </dt>
                  <dd className="mt-0.5 text-ink tnum">
                    {preview.contentType} · {formatBytes(preview.size)}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
                <div className="min-w-0">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
                    Property
                  </dt>
                  <dd className="mt-0.5 text-ink">
                    {preview.propertyId ? (
                      propertyById.get(preview.propertyId) ? (
                        <Link
                          href={`/properties/${preview.propertyId}`}
                          className="inline-flex items-center gap-1 text-accent underline-offset-4 hover:underline"
                        >
                          {propertyById.get(preview.propertyId)?.name}
                          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                        </Link>
                      ) : (
                        "Linked record was deleted"
                      )
                    ) : (
                      "Not linked to a property"
                    )}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
                    Source
                  </dt>
                  <dd className="mt-0.5 text-ink">
                    {preview.source === "ai" ? "AI concept" : "Upload"}
                  </dd>
                </div>
              </div>
            </dl>

            {preview.prompt ? (
              <div className="rounded-field border border-border bg-surface-2 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
                  Prompt
                </p>
                <p className="mt-1 text-[12px] leading-5 text-ink-2">{preview.prompt}</p>
              </div>
            ) : null}

            {preview.caption ? (
              <div className="rounded-field border border-border bg-surface-2 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
                  Caption
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[12px] leading-5 text-ink-2">
                  {preview.caption}
                </p>
              </div>
            ) : null}

            <p className={cn("text-[11px] leading-5 text-muted")}>
              Stored at{" "}
              <code className="rounded bg-surface-2 px-1 py-0.5 text-[10px]">
                {preview.storagePath}
              </code>
            </p>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void handleDelete()}
        title="Delete this image?"
        description={
          pendingDelete
            ? `“${pendingDelete.name}” will be removed from Cloud Storage and your media library.`
            : ""
        }
        confirmLabel="Delete image"
        loading={deleting}
        body={
          <p className="text-sm leading-6 text-ink-2">
            The Cloud Storage object and its Firestore metadata are both removed.
            Any social draft that referenced it keeps its copied preview URL but can
            no longer resolve the original file.
          </p>
        }
      />
    </div>
  );
}
