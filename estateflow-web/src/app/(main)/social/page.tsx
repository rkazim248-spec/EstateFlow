"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarClock,
  Check,
  Clock3,
  Image as ImageIcon,
  Link2,
  List as ListIcon,
  PencilLine,
  Plus,
  Send,
  Settings2,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { MediaThumbnail } from "@/components/media/media-thumbnail";
import { PlatformMark } from "@/components/social/platform-mark";
import { PostPreview } from "@/components/social/post-preview";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  InlineNotice,
  Input,
  Modal,
  PageHeader,
  SectionHeading,
  SegmentedControl,
  Skeleton,
  Textarea,
  buttonClasses,
  useToast,
} from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { DEFAULT_TIME_ZONE, SOCIAL_PLATFORMS } from "@/lib/constants";
import { createSocialDraft, deleteSocialPost } from "@/lib/data";
import { describeDataError } from "@/lib/errors";
import { useMediaLibrary } from "@/lib/media";
import { formatDateTime } from "@/lib/money";
import {
  SOCIAL_RESULT_META,
  SOCIAL_STATUS_META,
  SOCIAL_STATUS_ORDER,
  formatInTimeZone,
  hashtagString,
  normalizeHashtags,
  platformName,
  platformRequirement,
  useSocialPosts,
  useSocialResults,
  zonedDateTimeToUtc,
} from "@/lib/social";
import type { MediaRecord, SocialPostRecord, SocialPostStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

type Tab = "composer" | "posts" | "accounts";
type StatusFilter = SocialPostStatus | "all";

const EMPTY_COPY: Record<StatusFilter, { title: string; description: string }> = {
  all: {
    title: "No posts yet",
    description: "Create a draft to plan a caption, media and destinations.",
  },
  draft: {
    title: "No drafts",
    description: "Drafts you save are stored in Firestore and never sent to a platform.",
  },
  scheduled: {
    title: "No scheduled posts",
    description:
      "Scheduling is disabled because this deployment has no background publisher. Saving a planned time keeps the post as a draft.",
  },
  publishing: {
    title: "Nothing is publishing",
    description:
      "There is no publisher worker in this build, so no post can enter the publishing state.",
  },
  published: {
    title: "No published posts",
    description:
      "No platform account is connected, so no publication attempt can succeed. This state will remain empty until publishing is configured.",
  },
  failed: {
    title: "No failed attempts",
    description:
      "No publication has been attempted. Per-destination failures would appear here once a worker exists.",
  },
  cancelled: {
    title: "No cancelled posts",
    description:
      "Cancelling applies to scheduled posts. Since scheduling is not running, there is nothing to cancel.",
  },
};

const TABS: Array<{ value: Tab; label: string; icon: React.ReactNode }> = [
  { value: "composer", label: "Compose", icon: <PencilLine className="h-3.5 w-3.5" /> },
  { value: "posts", label: "Posts", icon: <ListIcon className="h-3.5 w-3.5" /> },
  { value: "accounts", label: "Accounts", icon: <Link2 className="h-3.5 w-3.5" /> },
];

function postTitle(post: SocialPostRecord): string {
  const caption = post.caption.trim();
  if (!caption) return "Untitled draft";
  return caption.length > 70 ? `${caption.slice(0, 70)}…` : caption;
}

function SocialPageInner() {
  const params = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();

  const initialMediaId = params.get("media");
  const requestedTab = params.get("tab");
  const [tab, setTab] = useState<Tab>(() =>
    requestedTab === "posts" || requestedTab === "accounts"
      ? requestedTab
      : "composer",
  );

  const {
    media,
    loading: mediaLoading,
    error: mediaError,
    retry: retryMedia,
  } = useMediaLibrary();
  const {
    posts,
    loading: postsLoading,
    error: postsError,
    retry: retryPosts,
  } = useSocialPosts();

  /* Composer state ------------------------------------------------------- */
  const [caption, setCaption] = useState("");
  const [captionError, setCaptionError] = useState<string | null>(null);
  const [hashtagsRaw, setHashtagsRaw] = useState("");
  const [hashtagsError, setHashtagsError] = useState<string | null>(null);
  const [mediaId, setMediaId] = useState<string | null>(null);
  const [destinations, setDestinations] = useState<string[]>([]);
  const [destinationsError, setDestinationsError] = useState<string | null>(null);
  const [plannedLocal, setPlannedLocal] = useState("");
  const [plannedError, setPlannedError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SocialPostRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const appliedInitialMedia = useRef(false);

  const mediaById = useMemo(
    () => new Map((media ?? []).map((record) => [record.id, record])),
    [media],
  );
  const selectedMedia = mediaId ? mediaById.get(mediaId) ?? null : null;
  const hashtags = useMemo(() => normalizeHashtags(hashtagsRaw), [hashtagsRaw]);
  const plannedPreview = useMemo(
    () => (plannedLocal ? zonedDateTimeToUtc(plannedLocal, DEFAULT_TIME_ZONE) : null),
    [plannedLocal],
  );

  const postList = posts ?? [];
  const counts = useMemo(() => {
    const result: Record<SocialPostStatus, number> = {
      draft: 0,
      scheduled: 0,
      publishing: 0,
      published: 0,
      failed: 0,
      cancelled: 0,
    };
    for (const post of postList) result[post.status] += 1;
    return result;
  }, [postList]);

  const filteredPosts = useMemo(
    () =>
      statusFilter === "all"
        ? postList
        : postList.filter((post) => post.status === statusFilter),
    [postList, statusFilter],
  );

  const detailPost = detailId
    ? postList.find((post) => post.id === detailId) ?? null
    : null;
  const detailMedia =
    detailPost?.mediaId ? mediaById.get(detailPost.mediaId) ?? null : null;
  const {
    results: detailResults,
    loading: resultsLoading,
    error: resultsError,
  } = useSocialResults(detailId);

  useEffect(() => {
    if (appliedInitialMedia.current || !initialMediaId || media === null) return;
    appliedInitialMedia.current = true;
    const found = media.find((record) => record.id === initialMediaId);
    if (found) {
      setMediaId(found.id);
      setTab("composer");
    } else {
      toast({
        variant: "info",
        title: "That image is no longer in your library",
        description: "It may have been deleted. Choose another image or continue without one.",
      });
    }
  }, [initialMediaId, media, toast]);

  useEffect(() => {
    if (mediaId && media !== null && !media.some((record) => record.id === mediaId)) {
      setMediaId(null);
    }
  }, [mediaId, media]);

  useEffect(() => {
    if (detailId && !postsLoading && !detailPost) setDetailId(null);
  }, [detailId, postsLoading, detailPost]);

  function resetComposer() {
    setCaption("");
    setCaptionError(null);
    setHashtagsRaw("");
    setHashtagsError(null);
    setMediaId(null);
    setDestinations([]);
    setDestinationsError(null);
    setPlannedLocal("");
    setPlannedError(null);
    setFormError(null);
  }

  function toggleDestination(id: string) {
    setDestinations((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
    if (destinationsError) setDestinationsError(null);
  }

  async function handleSaveDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || saving) return;

    const trimmedCaption = caption.trim();
    const tags = normalizeHashtags(hashtagsRaw);
    let invalid = false;

    if (!trimmedCaption) {
      setCaptionError("Write a caption or a short note for this post.");
      invalid = true;
    } else if (trimmedCaption.length > 2200) {
      setCaptionError("Keep the caption under 2200 characters.");
      invalid = true;
    }

    if (hashtagsRaw.trim() && tags.length === 0) {
      setHashtagsError("Use letters, numbers or underscores after the # sign.");
      invalid = true;
    }

    if (destinations.length === 0) {
      setDestinationsError("Select at least one destination.");
      invalid = true;
    }

    let plannedDate: Date | null = null;
    if (plannedLocal) {
      plannedDate = zonedDateTimeToUtc(plannedLocal, DEFAULT_TIME_ZONE);
      if (!plannedDate) {
        setPlannedError("Enter a valid date and time.");
        invalid = true;
      } else if (plannedDate.getTime() <= Date.now()) {
        setPlannedError("Choose a time in the future.");
        invalid = true;
      }
    }

    if (invalid) return;

    setSaving(true);
    setFormError(null);
    try {
      await createSocialDraft(user.uid, {
        caption: trimmedCaption,
        hashtags: hashtagString(tags),
        mediaId: selectedMedia?.id ?? null,
        mediaUrl: null,
        destinations,
        status: "draft",
        scheduledFor: plannedDate,
        timeZone: DEFAULT_TIME_ZONE,
      });
      toast({
        variant: "success",
        title: "Draft saved",
        description:
          "No platform was contacted. The post is stored as a draft, not scheduled.",
      });
      resetComposer();
      setStatusFilter("all");
      setTab("posts");
    } catch (error) {
      setFormError(describeDataError(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePost() {
    if (!pendingDelete || !user || deleting) return;
    setDeleting(true);
    try {
      await deleteSocialPost(user.uid, pendingDelete.id);
      toast({ variant: "success", title: "Draft deleted" });
      if (detailId === pendingDelete.id) setDetailId(null);
      setPendingDelete(null);
    } catch (error) {
      toast({
        variant: "error",
        title: "Could not delete the draft",
        description: describeDataError(error),
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Distribution"
        title="Social Media Hub"
        description="Plan captions, attach library images and preview how a post would look. This build saves drafts only — it has no connected accounts and no publisher."
        actions={
          <>
            <Link href="/media" className={buttonClasses("secondary", "md")}>
              <ImageIcon className="h-4 w-4" aria-hidden="true" />
              Media Library
            </Link>
            {tab !== "composer" ? (
              <Button
                icon={<Plus className="h-4 w-4" aria-hidden="true" />}
                onClick={() => {
                  resetComposer();
                  setTab("composer");
                }}
              >
                New post
              </Button>
            ) : null}
          </>
        }
      />

      <div className="mb-5">
        <InlineNotice tone="warning" title="Drafts only — nothing is published">
          No social account is connected, no OAuth callback exists, and no
          background publisher is running. Drafts are saved in Firestore and are
          never sent to a platform. Connecting and publishing require the
          server-side infrastructure listed under Accounts and in the README.
        </InlineNotice>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          ariaLabel="Social hub sections"
          options={TABS}
        />
        <p className="text-[11px] text-muted">
          Scheduling time zone: <span className="font-medium text-ink-2">{DEFAULT_TIME_ZONE}</span>
        </p>
      </div>

      {tab === "composer" ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card className="min-w-0 p-5">
            <SectionHeading
              title="Compose a post"
              description="The draft keeps its media reference, caption, hashtags and planned destinations. It does not connect an account."
            />

            <form className="mt-5 space-y-4" onSubmit={handleSaveDraft} noValidate>
              {formError ? (
                <InlineNotice tone="danger" title="Could not save the draft">
                  {formError}
                </InlineNotice>
              ) : null}

              <Field
                label="Media"
                optional
                hint="Choose an image from your private Media Library. Some platforms require one."
              >
                {selectedMedia ? (
                  <div className="flex gap-3 rounded-field border border-border bg-surface-2 p-2">
                    <MediaThumbnail
                      storagePath={selectedMedia.storagePath}
                      alt={selectedMedia.name}
                      className="h-[74px] w-[98px] shrink-0 rounded-md"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium text-ink">
                        {selectedMedia.name}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted tnum">
                        {selectedMedia.createdAt
                          ? formatDateTime(selectedMedia.createdAt)
                          : "Date unavailable"}
                      </p>
                      <div className="mt-1.5 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setPickerOpen(true)}
                          className="text-[11px] font-medium text-accent underline-offset-4 hover:underline"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => setMediaId(null)}
                          className="inline-flex items-center gap-1 text-[11px] text-muted transition-colors hover:text-danger"
                        >
                          <X className="h-3 w-3" aria-hidden="true" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-field border border-dashed border-border-strong bg-surface-2/50 px-3 py-5 text-[12px] text-muted transition-colors hover:border-accent hover:text-accent"
                  >
                    <ImageIcon className="h-4 w-4" aria-hidden="true" />
                    Choose an image
                  </button>
                )}
              </Field>

              <div>
                <Field
                  label="Caption"
                  htmlFor="social-caption"
                  required
                  error={captionError ?? undefined}
                  hint="Shown in every preview. Platform-specific limits are not enforced because no platform is connected."
                >
                  <Textarea
                    id="social-caption"
                    value={caption}
                    onChange={(event) => {
                      setCaption(event.target.value);
                      if (captionError) setCaptionError(null);
                    }}
                    rows={5}
                    maxLength={2200}
                    placeholder="Describe the listing, the location and the next step…"
                    aria-invalid={Boolean(captionError)}
                    aria-describedby={captionError ? "social-caption-error" : undefined}
                    disabled={saving}
                  />
                </Field>
                <p className="mt-1 text-right text-[10px] text-muted tnum">
                  {caption.length}/2200
                </p>
              </div>

              <div>
                <Field
                  label="Hashtags"
                  htmlFor="social-hashtags"
                  optional
                  error={hashtagsError ?? undefined}
                  hint="Separate with spaces. Up to 20 tags; the # is added automatically."
                >
                  <Input
                    id="social-hashtags"
                    value={hashtagsRaw}
                    onChange={(event) => {
                      setHashtagsRaw(event.target.value);
                      if (hashtagsError) setHashtagsError(null);
                    }}
                    maxLength={500}
                    placeholder="lahore realestate apartment"
                    aria-invalid={Boolean(hashtagsError)}
                    aria-describedby={hashtagsError ? "social-hashtags-error" : undefined}
                    disabled={saving}
                  />
                </Field>
                {hashtags.length > 0 ? (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {hashtags.map((tag) => (
                      <Badge key={tag} tone="neutral">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>

              <div>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[13px] font-medium text-ink">Destinations</p>
                  <span className="text-[11px] text-muted">
                    {destinations.length} selected
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] leading-5 text-muted">
                  Recorded on the draft only. No account is connected, so nothing
                  is sent to these platforms.
                </p>
                <div
                  role="group"
                  aria-label="Destinations"
                  className="mt-2 grid gap-2 sm:grid-cols-2"
                >
                  {SOCIAL_PLATFORMS.map((platform) => {
                    const selected = destinations.includes(platform.id);
                    return (
                      <button
                        key={platform.id}
                        type="button"
                        role="checkbox"
                        aria-checked={selected}
                        onClick={() => toggleDestination(platform.id)}
                        disabled={saving}
                        className={cn(
                          "flex items-center gap-2 rounded-field border px-2.5 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                          selected
                            ? "border-accent bg-accent-soft/50"
                            : "border-border bg-surface hover:border-border-strong hover:bg-surface-2",
                        )}
                      >
                        <PlatformMark
                          id={platform.id}
                          className="h-6 w-6 rounded-md text-[9px]"
                        />
                        <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-ink">
                          {platform.name}
                        </span>
                        <span
                          className={cn(
                            "grid h-4 w-4 shrink-0 place-items-center rounded border",
                            selected
                              ? "border-accent bg-accent text-accent-ink"
                              : "border-border-strong bg-surface",
                          )}
                          aria-hidden="true"
                        >
                          {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {destinationsError ? (
                  <p role="alert" className="mt-1.5 text-xs leading-5 text-danger">
                    {destinationsError}
                  </p>
                ) : null}
              </div>

              <Field
                label="Planned time"
                htmlFor="social-planned"
                optional
                error={plannedError ?? undefined}
                hint={`Interpreted in ${DEFAULT_TIME_ZONE}. Stored on the draft; no scheduler will act on it.`}
              >
                <Input
                  id="social-planned"
                  type="datetime-local"
                  value={plannedLocal}
                  onChange={(event) => {
                    setPlannedLocal(event.target.value);
                    if (plannedError) setPlannedError(null);
                  }}
                  aria-invalid={Boolean(plannedError)}
                  aria-describedby={plannedError ? "social-planned-error" : undefined}
                  disabled={saving}
                />
              </Field>
              {plannedPreview ? (
                <p className="-mt-2 text-[10.5px] text-muted">
                  {formatInTimeZone(plannedPreview, DEFAULT_TIME_ZONE)} ·{" "}
                  {DEFAULT_TIME_ZONE}
                </p>
              ) : null}

              <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetComposer}
                  disabled={saving}
                >
                  Clear
                </Button>
                <Button
                  type="submit"
                  loading={saving}
                  icon={<Send className="h-4 w-4" aria-hidden="true" />}
                >
                  Save draft
                </Button>
              </div>
              <p className="text-[10.5px] leading-5 text-muted">
                Saving creates a Firestore draft under your account. It does not
                schedule or publish anything.
              </p>
            </form>
          </Card>

          <Card className="min-w-0 p-5">
            <SectionHeading
              title="Previews"
              description="Local layouts built from this draft. No platform is contacted."
              action={
                <Badge tone="neutral">
                  {destinations.length} destination{destinations.length === 1 ? "" : "s"}
                </Badge>
              }
            />

            {destinations.length === 0 ? (
              <EmptyState
                className="mt-4 py-10"
                icon={<PencilLine className="h-5 w-5" aria-hidden="true" />}
                title="Select a destination to preview"
                description="Previews are generated locally from the caption, hashtags and media. They never call a platform API."
              />
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {destinations.map((id) => (
                  <PostPreview
                    key={id}
                    platformId={id}
                    caption={caption}
                    hashtags={hashtags}
                    media={selectedMedia}
                  />
                ))}
              </div>
            )}

            <p className="mt-4 border-t border-border pt-3 text-[10.5px] leading-5 text-muted">
              Each preview says “no account connected” on purpose. Nothing on this
              screen can post, and no result is fabricated.
            </p>
          </Card>
        </div>
      ) : null}

      {tab === "posts" ? (
        <div className="space-y-5">
          <Card className="p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <SectionHeading
                title="Scheduler"
                description={`Default time zone: ${DEFAULT_TIME_ZONE}. No automatic publishing is running.`}
              />
              <Badge tone="warning" dot>
                Inactive
              </Badge>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-field border border-border bg-surface-2 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
                  Statuses
                </p>
                <p className="mt-1 text-[11.5px] leading-5 text-ink-2">
                  Drafts · Scheduled · Publishing · Published · Failed · Cancelled
                </p>
              </div>
              <div className="rounded-field border border-border bg-surface-2 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
                  Queue
                </p>
                <p className="mt-1 text-[11.5px] leading-5 text-ink-2">
                  {counts.scheduled} scheduled post{counts.scheduled === 1 ? "" : "s"}{" "}
                  will publish automatically.
                </p>
              </div>
              <div className="rounded-field border border-border bg-surface-2 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
                  Missing
                </p>
                <p className="mt-1 text-[11.5px] leading-5 text-ink-2">
                  Server-side OAuth, encrypted tokens, a background worker and retry
                  handling.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <SectionHeading
                title="Posts"
                description="Saved drafts and any future publication state. Statuses are read from Firestore, never inferred."
              />
              <Button
                size="sm"
                icon={<Plus className="h-3.5 w-3.5" aria-hidden="true" />}
                onClick={() => setTab("composer")}
              >
                New post
              </Button>
            </div>

            <div
              role="group"
              aria-label="Filter posts by status"
              className="mt-4 flex flex-wrap gap-1.5"
            >
              {(
                [
                  { value: "all" as const, label: "All", count: postList.length },
                  ...SOCIAL_STATUS_ORDER.map((status) => ({
                    value: status,
                    label: SOCIAL_STATUS_META[status].label,
                    count: counts[status],
                  })),
                ] satisfies Array<{ value: StatusFilter; label: string; count: number }>
              ).map((filter) => {
                const active = statusFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setStatusFilter(filter.value)}
                    aria-pressed={active}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                      active
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-border bg-surface text-ink-2 hover:border-border-strong hover:bg-surface-2",
                    )}
                  >
                    {filter.label}
                    <span
                      className={cn(
                        "rounded-full px-1 text-[9.5px] tnum",
                        active ? "bg-accent/10" : "bg-surface-2 text-muted",
                      )}
                    >
                      {filter.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {postsError ? (
              <div className="mt-4">
                <InlineNotice
                  tone="danger"
                  title="Could not load your drafts"
                  action={
                    <Button variant="secondary" size="sm" onClick={retryPosts}>
                      Retry
                    </Button>
                  }
                >
                  {postsError} Deploy the{" "}
                  <code className="rounded bg-surface-2 px-1 py-0.5 text-[11px]">
                    users/&#123;uid&#125;
                  </code>{" "}
                  Firestore rules described in the README.
                </InlineNotice>
              </div>
            ) : null}

            <div className="mt-4">
              {postsLoading && posts === null ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((index) => (
                    <Skeleton key={index} className="h-32 w-full rounded-card" />
                  ))}
                </div>
              ) : postList.length === 0 ? (
                <EmptyState
                  icon={<Send className="h-5 w-5" aria-hidden="true" />}
                  title="No posts yet"
                  description="Write a caption, choose an image and select destinations to save your first draft. Nothing will be published."
                  action={
                    <Button
                      icon={<Plus className="h-4 w-4" aria-hidden="true" />}
                      onClick={() => setTab("composer")}
                    >
                      Create a post
                    </Button>
                  }
                />
              ) : filteredPosts.length === 0 ? (
                <EmptyState
                  icon={<Settings2 className="h-5 w-5" aria-hidden="true" />}
                  title={EMPTY_COPY[statusFilter].title}
                  description={EMPTY_COPY[statusFilter].description}
                  action={
                    statusFilter === "all" ? undefined : (
                      <Button variant="secondary" onClick={() => setStatusFilter("all")}>
                        Show all posts
                      </Button>
                    )
                  }
                />
              ) : (
                <ul className="space-y-3">
                  {filteredPosts.map((post) => {
                    const meta = SOCIAL_STATUS_META[post.status];
                    const postMedia = post.mediaId
                      ? mediaById.get(post.mediaId) ?? null
                      : null;
                    return (
                      <li key={post.id}>
                        <Card className="overflow-hidden">
                          <div className="flex flex-col sm:flex-row">
                            <div className="shrink-0 border-b border-border sm:w-36 sm:border-b-0 sm:border-r">
                              {postMedia ? (
                                <MediaThumbnail
                                  storagePath={postMedia.storagePath}
                                  alt={postMedia.name}
                                  className="aspect-[16/9] w-full sm:h-full sm:aspect-auto"
                                />
                              ) : (
                                <div className="flex h-20 w-full items-center justify-center bg-surface-2 sm:h-full">
                                  <ImageIcon
                                    className="h-5 w-5 text-muted"
                                    aria-hidden="true"
                                  />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1 p-3.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge tone={meta.tone} dot>
                                  {meta.label}
                                </Badge>
                                <span className="text-[10.5px] text-muted">
                                  {post.createdAt
                                    ? formatDateTime(post.createdAt)
                                    : "Date unavailable"}
                                </span>
                                {post.scheduledFor ? (
                                  <span className="inline-flex items-center gap-1 text-[10.5px] text-muted">
                                    <Clock3 className="h-3 w-3" aria-hidden="true" />
                                    Planned {formatInTimeZone(post.scheduledFor)}
                                  </span>
                                ) : null}
                              </div>

                              <p className="mt-2 line-clamp-2 text-[12.5px] leading-5 text-ink">
                                {post.caption || "No caption"}
                              </p>
                              {post.hashtags ? (
                                <p className="mt-0.5 line-clamp-1 text-[11px] text-accent">
                                  {post.hashtags}
                                </p>
                              ) : null}

                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                {post.destinations.length === 0 ? (
                                  <span className="text-[10.5px] text-muted">
                                    No destinations recorded
                                  </span>
                                ) : (
                                  post.destinations.map((id) => (
                                    <span
                                      key={id}
                                      className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 py-0.5 pl-1 pr-2 text-[10px] text-ink-2"
                                    >
                                      <PlatformMark
                                        id={id}
                                        className="h-4 w-4 rounded text-[7px]"
                                      />
                                      {platformName(id)}
                                    </span>
                                  ))
                                )}
                              </div>

                              <div className="mt-3 flex items-center gap-2 border-t border-border pt-2.5">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => setDetailId(post.id)}
                                >
                                  View draft
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  icon={<Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
                                  onClick={() => setPendingDelete(post)}
                                >
                                  Delete
                                </Button>
                                <span className="ml-auto text-[10px] text-muted">
                                  {post.status === "draft" ? "Not sent" : meta.label}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Card>
        </div>
      ) : null}

      {tab === "accounts" ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid gap-3 sm:grid-cols-2">
            {SOCIAL_PLATFORMS.map((platform) => (
              <Card key={platform.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <PlatformMark id={platform.id} className="h-9 w-9 rounded-[10px] text-[11px]" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-ink">
                        {platform.name}
                      </p>
                      <p className="text-[10px] text-muted">0 accounts connected</p>
                    </div>
                  </div>
                  <Badge tone="warning">Setup Required</Badge>
                </div>

                <p className="mt-3 text-[11.5px] leading-5 text-ink-2">
                  {platform.requirement}
                </p>

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
                  <span className="text-[10px] leading-4 text-muted">
                    Connection flow not implemented
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled
                    title="Server-side OAuth and encrypted token storage are not configured."
                  >
                    Connect
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <aside className="space-y-4">
            <Card className="p-5">
              <SectionHeading
                title="Connection states"
                description="The hub only shows a state the data supports."
              />
              <ul className="mt-3 space-y-2.5 text-[11.5px] leading-5 text-ink-2">
                <li>
                  <span className="font-medium text-ink">Not connected</span> — no
                  account has been authorised.
                </li>
                <li>
                  <span className="font-medium text-ink">Connected</span> — a
                  server-side token is present and usable.
                </li>
                <li>
                  <span className="font-medium text-ink">Reconnection required</span>{" "}
                  — a token expired or was revoked.
                </li>
                <li>
                  <span className="font-medium text-ink">Setup required</span> — the
                  app lacks the provider approval or configuration.
                </li>
                <li>
                  <span className="font-medium text-ink">Temporarily unavailable</span>{" "}
                  — the provider is down or rate-limiting.
                </li>
              </ul>
              <p className="mt-3 border-t border-border pt-3 text-[10.5px] leading-5 text-muted">
                Only <span className="font-medium text-ink-2">Setup Required</span>{" "}
                applies to this deployment.
              </p>
            </Card>

            <Card className="p-5">
              <h2 className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink">
                <Users className="h-4 w-4 text-muted" aria-hidden="true" />
                Multi-account
              </h2>
              <p className="mt-2 text-[11.5px] leading-5 text-ink-2">
                Accounts would live under{" "}
                <code className="rounded bg-surface-2 px-1 py-0.5 text-[10px]">
                  users/&#123;uid&#125;/socialAccounts
                </code>
                , with access tokens held server-side. A post would select one
                account per platform and receive an independent result for each
                destination.
              </p>
              <p className="mt-2 text-[10.5px] leading-5 text-muted">
                Per-account selection is not available because no account can be
                connected yet. No placeholder accounts are created.
              </p>
            </Card>

            <Card className="p-5">
              <h2 className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink">
                <CalendarClock className="h-4 w-4 text-muted" aria-hidden="true" />
                What is missing
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-[11.5px] leading-5 text-ink-2">
                <li>Server-side OAuth callback per platform</li>
                <li>Encrypted token storage and refresh handling</li>
                <li>A background worker (Cloud Run or Functions)</li>
                <li>Per-destination retry and rate-limit handling</li>
              </ul>
              <p className="mt-2 text-[10.5px] leading-5 text-muted">
                The README records these as outstanding integrations rather than
                claiming a working publisher.
              </p>
            </Card>
          </aside>
        </div>
      ) : null}

      <Modal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Choose an image"
        description="Images from your private Media Library. The draft stores only a reference to the media record."
        size="lg"
      >
        {mediaError ? (
          <InlineNotice
            tone="warning"
            title="Media library unavailable"
            action={
              <Button variant="secondary" size="sm" onClick={retryMedia}>
                Retry
              </Button>
            }
          >
            {mediaError}
          </InlineNotice>
        ) : mediaLoading && media === null ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <Skeleton key={index} className="aspect-[4/3] w-full rounded-card" />
            ))}
          </div>
        ) : (media ?? []).length === 0 ? (
          <EmptyState
            icon={<ImageIcon className="h-5 w-5" aria-hidden="true" />}
            title="No images in your library"
            description="Upload an image or save an AI concept first, then return to this draft."
            action={
              <Link href="/media" className={buttonClasses("primary", "md")}>
                Open Media Library
              </Link>
            }
          />
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {(media ?? []).map((record: MediaRecord) => {
              const active = record.id === mediaId;
              return (
                <li key={record.id} className="min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      setMediaId(record.id);
                      setPickerOpen(false);
                    }}
                    aria-pressed={active}
                    className={cn(
                      "block w-full overflow-hidden rounded-card border text-left transition-colors",
                      active
                        ? "border-accent ring-2 ring-[var(--ring)]"
                        : "border-border hover:border-border-strong",
                    )}
                  >
                    <MediaThumbnail
                      storagePath={record.storagePath}
                      alt={record.name}
                      className="aspect-[4/3] w-full"
                    />
                    <span className="block px-2.5 py-2">
                      <span className="block truncate text-[11px] font-medium text-ink">
                        {record.name}
                      </span>
                      <span className="mt-0.5 block text-[9.5px] text-muted tnum">
                        {record.createdAt
                          ? formatDateTime(record.createdAt)
                          : "Date unavailable"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Modal>

      <Modal
        open={Boolean(detailPost)}
        onClose={() => setDetailId(null)}
        title="Post details"
        description={
          detailPost
            ? `${SOCIAL_STATUS_META[detailPost.status].label} · saved ${detailPost.createdAt ? formatDateTime(detailPost.createdAt) : "at an unknown time"}`
            : undefined
        }
        size="lg"
        footer={
          detailPost ? (
            <>
              <Button variant="secondary" onClick={() => setDetailId(null)}>
                Close
              </Button>
              <Button
                variant="danger"
                icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                onClick={() => {
                  setPendingDelete(detailPost);
                  setDetailId(null);
                }}
              >
                Delete draft
              </Button>
            </>
          ) : null
        }
      >
        {detailPost ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={SOCIAL_STATUS_META[detailPost.status].tone} dot>
                {SOCIAL_STATUS_META[detailPost.status].label}
              </Badge>
              <span className="text-[11px] text-muted">
                {SOCIAL_STATUS_META[detailPost.status].description}
              </span>
            </div>

            {detailPost.scheduledFor ? (
              <div className="flex items-center gap-2 rounded-field border border-border bg-surface-2 px-3 py-2 text-[11.5px] text-ink-2">
                <Clock3 className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                Planned for {formatInTimeZone(detailPost.scheduledFor)} ·{" "}
                {detailPost.timeZone}
              </div>
            ) : null}

            {detailPost.mediaId ? (
              detailMedia ? (
                <MediaThumbnail
                  storagePath={detailMedia.storagePath}
                  alt={detailMedia.name}
                  className="aspect-[16/9] w-full rounded-card border border-border"
                />
              ) : (
                <InlineNotice tone="warning" title="Referenced image is unavailable">
                  The draft points to media that is no longer in your library. The
                  caption and destinations are still intact.
                </InlineNotice>
              )
            ) : null}

            <div className="rounded-field border border-border bg-surface-2 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
                Caption
              </p>
              <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-5 text-ink-2">
                {detailPost.caption || "No caption"}
              </p>
              {detailPost.hashtags ? (
                <p className="mt-2 break-words text-[11.5px] font-medium leading-5 text-accent">
                  {detailPost.hashtags}
                </p>
              ) : null}
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-medium text-ink">
                  Destinations and results
                </p>
                {resultsLoading ? (
                  <span className="text-[10.5px] text-muted">Checking results…</span>
                ) : null}
              </div>

              {detailPost.destinations.length === 0 ? (
                <p className="mt-1.5 text-[11.5px] text-muted">
                  No destinations were recorded on this draft.
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-border rounded-field border border-border">
                  {detailPost.destinations.map((id) => {
                    const result = detailResults.find(
                      (item) => item.platform === id,
                    );
                    const resultMeta = result
                      ? SOCIAL_RESULT_META[result.status]
                      : null;
                    return (
                      <li
                        key={id}
                        className="flex flex-wrap items-center gap-2 px-3 py-2.5"
                      >
                        <PlatformMark id={id} className="h-6 w-6 rounded-md text-[9px]" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-medium text-ink">
                            {platformName(id)}
                          </p>
                          <p className="mt-0.5 text-[10.5px] leading-4 text-muted">
                            {result
                              ? result.message ||
                                (result.attemptedAt
                                  ? `Attempted ${formatDateTime(result.attemptedAt)}`
                                  : "A result was recorded for this destination.")
                              : "No publication attempt recorded."}
                          </p>
                        </div>
                        {resultMeta ? (
                          <Badge tone={resultMeta.tone}>{resultMeta.label}</Badge>
                        ) : (
                          <Badge tone="neutral">Not attempted</Badge>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {resultsError ? (
                <div className="mt-2">
                  <InlineNotice tone="warning" title="Could not read publication results">
                    {resultsError}
                  </InlineNotice>
                </div>
              ) : null}
            </div>

            {detailResults.length === 0 ? (
              <InlineNotice tone="info" title="Nothing was published">
                This draft is stored in Firestore only. No platform is connected and
                no background worker is running. When publishing exists, each
                destination will write its own result under{" "}
                <code className="rounded bg-surface-2 px-1 py-0.5 text-[10px]">
                  socialPosts/&#123;postId&#125;/results/&#123;resultId&#125;
                </code>
                , so one failure does not hide another destination's success.
              </InlineNotice>
            ) : (
              <InlineNotice tone="info" title="Per-destination results">
                These results were written outside this composer. Review each
                destination independently; a success in one does not imply success
                in another.
              </InlineNotice>
            )}

            <p className="text-[10.5px] leading-5 text-muted">
              Draft id: <span className="font-mono">{detailPost.id}</span> · Media:{" "}
              {detailPost.mediaId ? (
                <span className="font-mono">{detailPost.mediaId}</span>
              ) : (
                "none"
              )}
            </p>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void handleDeletePost()}
        title="Delete this draft?"
        description={
          pendingDelete
            ? `“${postTitle(pendingDelete)}” will be removed from Firestore.`
            : ""
        }
        confirmLabel="Delete draft"
        loading={deleting}
        body={
          <p className="text-sm leading-6 text-ink-2">
            The draft document is deleted. Any image it references stays in your
            Media Library, and no platform is contacted or affected.
          </p>
        }
      />
    </div>
  );
}

export default function SocialPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-card" />
          <div className="grid gap-5 xl:grid-cols-2">
            <Skeleton className="h-[520px] w-full rounded-card" />
            <Skeleton className="h-[520px] w-full rounded-card" />
          </div>
        </div>
      }
    >
      <SocialPageInner />
    </Suspense>
  );
}
