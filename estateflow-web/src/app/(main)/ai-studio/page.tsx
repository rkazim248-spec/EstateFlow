"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  Image as ImageIcon,
  RefreshCw,
  Save,
  Send,
  Share2,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";

import { MediaThumbnail } from "@/components/media/media-thumbnail";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Field,
  InlineNotice,
  PageHeader,
  SectionHeading,
  Select,
  Skeleton,
  Textarea,
  buttonClasses,
  useToast,
} from "@/components/ui";
import {
  AI_ASPECT_RATIOS,
  AI_PURPOSES,
  AI_STYLES,
  type AiAspectRatioId,
  type AiPurposeId,
  type AiStyleId,
} from "@/lib/ai";
import { useAuth } from "@/lib/auth";
import { typeUsesBedrooms } from "@/lib/constants";
import { deleteMedia, uploadMedia } from "@/lib/data";
import { useData } from "@/lib/data-context";
import { describeStorageError } from "@/lib/errors";
import { downloadFromUrl, useMediaLibrary } from "@/lib/media";
import {
  formatAmountWithUnit,
  formatArea,
  formatDateTime,
  formatPkr,
} from "@/lib/money";
import { resolvedBedrooms, type MediaRecord } from "@/lib/types";
import { cn } from "@/lib/cn";

interface GenerationResult {
  image: { dataUrl: string; mimeType: string };
  text: string | null;
  prompt: string;
  model: string;
  aspectRatio: string;
}

interface ProviderState {
  configured: boolean;
  model: string;
  authConfigured?: boolean;
}

interface GenerationError {
  code: string;
  message: string;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = /data:([^;]+)/.exec(header)?.[1] ?? "image/png";
  const binary = atob(base64 ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mime });
}

function extensionFor(mimeType: string): string {
  if (mimeType.includes("jpeg")) return "jpg";
  if (mimeType.includes("webp")) return "webp";
  return "png";
}

export default function AiStudioPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { properties, propertiesLoading } = useData();
  const { media, loading: mediaLoading } = useMediaLibrary();
  const { toast } = useToast();

  const [prompt, setPrompt] = useState("");
  const [promptError, setPromptError] = useState<string | null>(null);
  const [propertyId, setPropertyId] = useState("");
  const [purpose, setPurpose] = useState<AiPurposeId>("sale");
  const [style, setStyle] = useState<AiStyleId>("editorial");
  const [aspectRatio, setAspectRatio] = useState<AiAspectRatioId>("4:3");

  const [provider, setProvider] = useState<ProviderState | null>(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<GenerationError | null>(null);
  const [saved, setSaved] = useState<MediaRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const propertyList = useMemo(
    () => [...(properties ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [properties],
  );
  const selectedProperty =
    propertyList.find((property) => property.id === propertyId) ?? null;

  const propertySummary = useMemo(() => {
    if (!selectedProperty) return "";
    const facts = [
      selectedProperty.type,
      typeUsesBedrooms(selectedProperty.type) && resolvedBedrooms(selectedProperty)
        ? `${resolvedBedrooms(selectedProperty)} bedrooms`
        : "",
      selectedProperty.area > 0
        ? formatArea(selectedProperty.area, selectedProperty.areaUnit)
        : "",
      selectedProperty.location,
      selectedProperty.purpose === "Rent" ? "offered for rent" : "offered for sale",
      selectedProperty.price > 0
        ? `asking ${formatAmountWithUnit(selectedProperty.price, selectedProperty.priceUnit)} (${formatPkr(selectedProperty.normalizedPrice)})`
        : "",
    ].filter(Boolean);
    return facts.join(", ");
  }, [selectedProperty]);

  const concepts = useMemo(
    () => (media ?? []).filter((record) => record.source === "ai").slice(0, 4),
    [media],
  );

  const selectedPurpose =
    AI_PURPOSES.find((option) => option.id === purpose) ?? AI_PURPOSES[0];
  const selectedStyle =
    AI_STYLES.find((option) => option.id === style) ?? AI_STYLES[0];
  const providerBlocked = provider?.configured === false;

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/ai/generate", { cache: "no-store", signal: controller.signal })
      .then((response) => response.json())
      .then((data: unknown) => {
        const payload = data as Partial<ProviderState>;
        if (typeof payload.configured === "boolean") {
          setProvider({
            configured: payload.configured,
            model: typeof payload.model === "string" ? payload.model : "gemini-2.5-flash-image",
            authConfigured: payload.authConfigured,
          });
        }
      })
      .catch(() => {
        // The POST route reports configuration problems with a readable error.
      });
    return () => controller.abort();
  }, []);

  async function generate() {
    if (!user || generating) return;
    const trimmed = prompt.trim();
    if (trimmed.length < 3) {
      setPromptError("Describe the image you want in a few words.");
      return;
    }

    setPromptError(null);
    setError(null);
    setSaved(null);
    setGenerating(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: trimmed,
          purpose,
          style,
          aspectRatio,
          propertySummary,
        }),
      });

      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        const failure = payload as {
          error?: { code?: string; message?: string };
        } | null;
        const code = failure?.error?.code ?? "request_failed";
        setError({
          code,
          message:
            failure?.error?.message ??
            `Generation failed with status ${response.status}.`,
        });
        if (code === "not_configured") {
          setProvider((current) => ({
            configured: false,
            model: current?.model ?? "gemini-2.5-flash-image",
            authConfigured: current?.authConfigured,
          }));
        }
        return;
      }

      setResult(payload as GenerationResult);
      toast({
        variant: "success",
        title: "Concept generated",
        description: "Review it, then save it to your media library if you want to keep it.",
      });
    } catch (requestError) {
      setError({
        code: "network",
        message:
          requestError instanceof Error
            ? requestError.message
            : "Could not reach the generation service.",
      });
    } finally {
      setGenerating(false);
    }
  }

  async function saveResult(): Promise<MediaRecord | null> {
    if (saved) return saved;
    if (!result || !user || saving) return null;

    setSaving(true);
    setSaveProgress(0);
    try {
      const blob = dataUrlToBlob(result.image.dataUrl);
      const baseName = selectedProperty?.name?.trim() || "AI concept";
      const record = await uploadMedia(blob, user.uid, {
        name: `${baseName} · ${selectedStyle.label}`,
        source: "ai",
        prompt: result.prompt,
        propertyId: propertyId || null,
        caption: result.text,
        onProgress: setSaveProgress,
      });
      setSaved(record);
      toast({
        variant: "success",
        title: "Saved to Media Library",
        description: "The image and its prompt are stored privately under your account.",
      });
      return record;
    } catch (saveError) {
      toast({
        variant: "error",
        title: "Could not save the image",
        description: describeStorageError(saveError),
      });
      return null;
    } finally {
      setSaving(false);
      setSaveProgress(0);
    }
  }

  async function useInSocial() {
    const record = saved ?? (await saveResult());
    if (record) router.push(`/social?media=${record.id}`);
  }

  async function handleDownload() {
    if (!result) return;
    const base =
      (selectedProperty?.name || "estateflow-concept")
        .replace(/[\\/:*?"<>|]+/g, "-")
        .trim()
        .slice(0, 60) || "estateflow-concept";
    await downloadFromUrl(
      result.image.dataUrl,
      `${base}.${extensionFor(result.image.mimeType)}`,
    );
  }

  async function handleShare() {
    if (!result) return;
    try {
      const blob = dataUrlToBlob(result.image.dataUrl);
      const file = new File([blob], `estateflow-concept.${extensionFor(blob.type)}`, {
        type: blob.type,
      });
      const shareData: ShareData = {
        files: [file],
        title: "EstateFlow concept",
        text: "Conceptual real-estate image generated in EstateFlow AI Studio.",
      };
      if (
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare(shareData)
      ) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(result.prompt);
      toast({
        variant: "info",
        title: "File sharing is not supported in this browser",
        description: "The generation prompt was copied to your clipboard instead.",
      });
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") {
        return;
      }
      toast({
        variant: "error",
        title: "Could not share the image",
        description:
          shareError instanceof Error ? shareError.message : "Try downloading it instead.",
      });
    }
  }

  async function copyPrompt() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.prompt);
      toast({ variant: "success", title: "Prompt copied" });
    } catch {
      toast({
        variant: "error",
        title: "Could not copy the prompt",
        description: "Your browser blocked clipboard access.",
      });
    }
  }

  async function handleDeleteSaved() {
    if (!saved || !user || deleting) return;
    setDeleting(true);
    try {
      await deleteMedia(user.uid, saved);
      setSaved(null);
      setResult(null);
      setDeleteOpen(false);
      toast({
        variant: "success",
        title: "Saved concept deleted",
        description: "The Storage object and its library record were removed.",
      });
    } catch (deleteError) {
      toast({
        variant: "error",
        title: "Could not delete the image",
        description: describeStorageError(deleteError),
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Creative"
        title="AI Image Studio"
        description="Turn a written brief and a listing's recorded facts into a conceptual visual. Results are illustrations, not photographs of the property, and nothing is generated until you ask."
        actions={
          <Link href="/media" className={buttonClasses("secondary", "md")}>
            <ImageIcon className="h-4 w-4" aria-hidden="true" />
            Media Library
          </Link>
        }
      />

      {providerBlocked ? (
        <div className="mb-5">
          <InlineNotice tone="warning" title="AI generation is not configured">
            <p>
              The server has no{" "}
              <code className="rounded bg-surface-2 px-1 py-0.5 text-[11px]">
                GEMINI_API_KEY
              </code>
              , so generation is switched off rather than simulated. Add the key to{" "}
              <code className="rounded bg-surface-2 px-1 py-0.5 text-[11px]">
                .env.local
              </code>{" "}
              (or your deployment's environment) and restart the app. Optionally set{" "}
              <code className="rounded bg-surface-2 px-1 py-0.5 text-[11px]">
                GEMINI_IMAGE_MODEL
              </code>
              ; the default is{" "}
              <code className="rounded bg-surface-2 px-1 py-0.5 text-[11px]">
                {provider?.model ?? "gemini-2.5-flash-image"}
              </code>
              .
            </p>
            <p className="mt-1.5">
              The key is read only on the server and is never sent to this browser.
              Generation uses your Google AI Studio quota and may incur provider
              charges.
            </p>
          </InlineNotice>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <Card className="min-w-0 p-5">
          <SectionHeading
            title="Brief"
            description="Be specific about the room, light, materials and mood. Avoid brand names and people."
          />

          <form
            className="mt-5 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void generate();
            }}
          >
            <div>
              <Field
                label="Prompt"
                htmlFor="ai-prompt"
                required
                error={promptError ?? undefined}
                hint="For example: a quiet living room with limewashed walls, oak floors and morning light from a side window."
              >
                <Textarea
                  id="ai-prompt"
                  value={prompt}
                  onChange={(event) => {
                    setPrompt(event.target.value);
                    if (promptError) setPromptError(null);
                  }}
                  rows={5}
                  maxLength={1200}
                  placeholder="Describe the scene you want to see…"
                  aria-invalid={Boolean(promptError)}
                  aria-describedby={promptError ? "ai-prompt-error" : undefined}
                  disabled={generating}
                />
              </Field>
              <p className="mt-1 text-right text-[10px] text-muted tnum">
                {prompt.length}/1200
              </p>
            </div>

            <Field
              label="Property context"
              htmlFor="ai-property"
              optional
              hint="Only recorded listing facts are sent — never the owner's name or phone."
            >
              <Select
                id="ai-property"
                value={propertyId}
                onChange={(event) => setPropertyId(event.target.value)}
                disabled={propertiesLoading || generating}
              >
                <option value="">
                  {propertyList.length === 0
                    ? "No properties available"
                    : "No property — generic scene"}
                </option>
                {propertyList.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                    {property.location ? ` — ${property.location}` : ""}
                  </option>
                ))}
              </Select>
            </Field>

            {selectedProperty ? (
              <div className="rounded-field border border-border bg-surface-2 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
                  Included as context
                </p>
                <p className="mt-1 text-[11.5px] leading-5 text-ink-2">
                  {propertySummary || "This listing has no descriptive facts recorded."}
                </p>
                <Link
                  href={`/properties/${selectedProperty.id}`}
                  className="mt-1.5 inline-flex items-center gap-1 text-[10.5px] font-medium text-accent underline-offset-4 hover:underline"
                >
                  Review the record
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Purpose" htmlFor="ai-purpose" hint={selectedPurpose.description}>
                <Select
                  id="ai-purpose"
                  value={purpose}
                  onChange={(event) => setPurpose(event.target.value as AiPurposeId)}
                  disabled={generating}
                >
                  {AI_PURPOSES.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Style" htmlFor="ai-style" hint={selectedStyle.description}>
                <Select
                  id="ai-style"
                  value={style}
                  onChange={(event) => setStyle(event.target.value as AiStyleId)}
                  disabled={generating}
                >
                  {AI_STYLES.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div>
              <p className="mb-1.5 text-[13px] font-medium leading-5 text-ink">
                Aspect ratio
              </p>
              <div
                role="radiogroup"
                aria-label="Aspect ratio"
                className="grid grid-cols-5 gap-1.5"
              >
                {AI_ASPECT_RATIOS.map((option) => {
                  const active = aspectRatio === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setAspectRatio(option.id)}
                      disabled={generating}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-field border px-1 py-2 transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                        active
                          ? "border-accent bg-accent-soft/60 text-accent"
                          : "border-border bg-surface text-muted hover:border-border-strong hover:text-ink",
                      )}
                    >
                      <span className="flex h-6 items-center justify-center" aria-hidden="true">
                        <span
                          className={cn(
                            "block rounded-[2px] border border-current",
                            option.boxClass,
                          )}
                        />
                      </span>
                      <span className="text-[11px] font-medium leading-4">{option.label}</span>
                      <span className="text-[9px] leading-3">{option.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={generating}
              disabled={providerBlocked}
              icon={<Wand2 className="h-4 w-4" aria-hidden="true" />}
            >
              {generating ? "Generating concept…" : "Generate concept"}
            </Button>

            <p className="text-[10.5px] leading-5 text-muted">
              {providerBlocked
                ? "Generation stays disabled until a provider key is configured on the server."
                : provider
                  ? `Provider configured · ${provider.model}. Prompts and the selected listing facts are sent to Google Gemini when you generate.`
                  : "The provider is checked when you generate. Prompts and selected listing facts are sent to Google Gemini."}
            </p>
          </form>
        </Card>

        <div className="min-w-0 space-y-5">
          <Card className="p-5">
            <SectionHeading
              title="Result"
              description="Review the image before saving. Nothing enters your library automatically."
              action={
                result ? (
                  <Badge tone="accent" dot>
                    AI concept
                  </Badge>
                ) : null
              }
            />

            <div
              className={cn(
                "mt-4 flex min-h-[300px] items-center justify-center overflow-hidden rounded-card border bg-surface-2 p-3 sm:min-h-[380px]",
                result || generating ? "border-border" : "border-dashed border-border-strong",
              )}
            >
              {generating ? (
                <div className="flex flex-col items-center px-6 text-center">
                  <span className="relative flex h-12 w-12 items-center justify-center">
                    <span className="absolute inset-0 rounded-full border border-border bg-surface" />
                    <Sparkles className="relative h-5 w-5 animate-pulse text-accent" aria-hidden="true" />
                  </span>
                  <p className="mt-3 text-[13px] font-medium text-ink">
                    Generating concept…
                  </p>
                  <p className="mt-1 max-w-xs text-[11.5px] leading-5 text-muted">
                    This usually takes 5–20 seconds. Keep this tab open; the image
                    appears here when the provider responds.
                  </p>
                </div>
              ) : result ? (
                // A data URL from the server response; next/image cannot optimise it.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={result.image.dataUrl}
                  alt="Generated conceptual real-estate image"
                  className="max-h-[520px] w-auto max-w-full rounded-lg border border-border object-contain"
                />
              ) : (
                <div className="flex flex-col items-center px-6 text-center">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-surface text-muted">
                    <ImageIcon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="mt-3 text-[13px] font-medium text-ink">
                    {providerBlocked
                      ? "Generation is unavailable"
                      : "Your concept will appear here"}
                  </p>
                  <p className="mt-1 max-w-sm text-[11.5px] leading-5 text-muted">
                    {providerBlocked
                      ? "The AI provider is not configured for this deployment. The page will keep this state rather than show a sample image."
                      : "Write a prompt, choose a style and ratio, then press Generate. No image is created until you do."}
                  </p>
                </div>
              )}
            </div>

            {error && error.code !== "not_configured" ? (
              <div className="mt-4">
                <InlineNotice
                  tone={
                    error.code === "rate_limited" ||
                    error.code === "provider_rate_limited"
                      ? "warning"
                      : "danger"
                  }
                  title="Generation did not complete"
                  action={
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => void generate()}
                      disabled={generating || providerBlocked}
                    >
                      Retry
                    </Button>
                  }
                >
                  {error.message}
                </InlineNotice>
              </div>
            ) : null}

            {result ? (
              <>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button
                    onClick={() => void saveResult()}
                    loading={saving}
                    disabled={Boolean(saved)}
                    icon={
                      saved ? (
                        <Check className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Save className="h-4 w-4" aria-hidden="true" />
                      )
                    }
                  >
                    {saved
                      ? "Saved to library"
                      : saving
                        ? `Saving ${saveProgress}%`
                        : "Save to library"}
                  </Button>
                  <Button
                    variant="secondary"
                    icon={<Send className="h-4 w-4" aria-hidden="true" />}
                    onClick={() => void useInSocial()}
                    loading={saving && !saved}
                    disabled={saving && Boolean(saved)}
                  >
                    Use in social post
                  </Button>
                  <Button
                    variant="secondary"
                    icon={<Download className="h-4 w-4" aria-hidden="true" />}
                    onClick={() => void handleDownload()}
                  >
                    Download
                  </Button>
                  <Button
                    variant="secondary"
                    icon={<Share2 className="h-4 w-4" aria-hidden="true" />}
                    onClick={() => void handleShare()}
                  >
                    Share
                  </Button>
                  <Button
                    variant="ghost"
                    icon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
                    onClick={() => void generate()}
                    disabled={generating}
                  >
                    Regenerate
                  </Button>
                  <Button
                    variant="ghost"
                    icon={<Copy className="h-4 w-4" aria-hidden="true" />}
                    onClick={() => void copyPrompt()}
                  >
                    Copy prompt
                  </Button>
                  {saved ? (
                    <Button
                      variant="ghost"
                      icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                      onClick={() => setDeleteOpen(true)}
                      disabled={deleting}
                    >
                      Delete saved
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
                      onClick={() => setResult(null)}
                    >
                      Discard
                    </Button>
                  )}
                </div>

                {saved ? (
                  <p className="mt-2 text-[11px] leading-5 text-muted">
                    Saved as “{saved.name}”.{" "}
                    <Link
                      href="/media"
                      className="font-medium text-accent underline-offset-4 hover:underline"
                    >
                      Open in Media Library
                    </Link>
                    .
                  </p>
                ) : (
                  <p className="mt-2 text-[11px] leading-5 text-muted">
                    This concept exists only in this browser tab until you save it.
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-[10.5px] text-muted">
                  <span>Model: {result.model}</span>
                  <span>Ratio: {result.aspectRatio}</span>
                  <span>Source: Google Gemini</span>
                  {result.text ? <span>Includes provider note</span> : null}
                </div>

                <p className="mt-2 text-[10.5px] leading-5 text-muted">
                  This is a conceptual illustration. Do not present it as a
                  photograph of the property, and disclose its AI origin when it is
                  used in marketing.
                </p>
              </>
            ) : null}
          </Card>

          <Card className="p-5">
            <SectionHeading
              title="Recent concepts"
              description="Saved AI images from your private library."
              action={
                <Link
                  href="/media"
                  className="inline-flex items-center gap-1 text-[12px] font-medium text-accent underline-offset-4 hover:underline"
                >
                  Open library
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              }
            />

            {mediaLoading ? (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[0, 1, 2, 3].map((index) => (
                  <Skeleton key={index} className="aspect-[4/3] w-full rounded-card" />
                ))}
              </div>
            ) : concepts.length === 0 ? (
              <p className="mt-4 rounded-field border border-dashed border-border-strong px-4 py-5 text-center text-[11.5px] leading-5 text-muted">
                No saved concepts yet. Generate an image and save it to see it here.
              </p>
            ) : (
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {concepts.map((record) => (
                  <li key={record.id} className="min-w-0">
                    <Link
                      href="/media"
                      className="group block overflow-hidden rounded-card border border-border bg-surface transition-colors hover:border-border-strong"
                    >
                      <MediaThumbnail
                        storagePath={record.storagePath}
                        alt={record.name}
                        className="aspect-[4/3] w-full"
                        imageClassName="transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                      <span className="block px-2.5 py-2">
                        <span className="block truncate text-[11px] font-medium text-ink">
                          {record.name}
                        </span>
                        <span className="mt-0.5 block text-[9.5px] text-muted tnum">
                          {record.createdAt ? formatDateTime(record.createdAt) : "Date unavailable"}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => void handleDeleteSaved()}
        title="Delete this saved concept?"
        description={
          saved
            ? `“${saved.name}” will be removed from Cloud Storage and your media library.`
            : ""
        }
        confirmLabel="Delete concept"
        loading={deleting}
        body={
          <p className="text-sm leading-6 text-ink-2">
            The generated image and its prompt metadata are deleted. This cannot be
            undone, and the preview in this tab will also be cleared.
          </p>
        }
      />
    </div>
  );
}
