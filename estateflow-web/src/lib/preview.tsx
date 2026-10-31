"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  ArrowUpRight,
  Maximize2,
  Monitor,
  Smartphone,
  Tablet,
  X,
} from "lucide-react";

import { SegmentedControl, buttonClasses } from "@/components/ui";
import { cn } from "@/lib/cn";
import { EstateFlowLogo } from "@/components/brand/estateflow-logo";

export type PreviewPreset = "desktop" | "tablet" | "mobile";

export const PREVIEW_PRESETS: Record<
  PreviewPreset,
  { width: number; height: number; label: string; hint: string }
> = {
  desktop: {
    width: 1440,
    height: 900,
    label: "Desktop",
    hint: "Laptop and desktop layouts",
  },
  tablet: {
    width: 768,
    height: 1024,
    label: "Tablet",
    hint: "Tablet layout with a navigation rail",
  },
  mobile: {
    width: 390,
    height: 844,
    label: "Mobile",
    hint: "Phone layout with bottom navigation",
  },
};

const STORAGE_KEY = "estateflow.preview";

interface PreviewContextValue {
  preset: PreviewPreset | null;
  enabled: boolean;
  isPreviewFrame: boolean;
  setPreset: (preset: PreviewPreset | null) => void;
  close: () => void;
}

const PreviewContext = createContext<PreviewContextValue | null>(null);

export function PreviewProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [preset, setPresetState] = useState<PreviewPreset | null>(null);
  const [isPreviewFrame, setIsPreviewFrame] = useState(false);
  const [framePath, setFramePath] = useState(pathname);
  const [scale, setScale] = useState(0.4);
  const canvasRef = useRef<HTMLDivElement>(null);

  const enabled =
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_ENABLE_DEVICE_PREVIEW === "true";

  const search =
    typeof window === "undefined" ? "" : window.location.search;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsPreviewFrame(params.get("preview") === "1");
    if (!enabled) return;
    try {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      if (stored === "desktop" || stored === "tablet" || stored === "mobile") {
        setPresetState(stored);
      }
    } catch {
      // sessionStorage may be unavailable; preview still works for this page.
    }
  }, [enabled]);

  const setPreset = useCallback(
    (next: PreviewPreset | null) => {
      setPresetState(next);
      setFramePath(`${pathname}${window.location.search}`);
      try {
        if (next) window.sessionStorage.setItem(STORAGE_KEY, next);
        else window.sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    },
    [pathname],
  );

  const close = useCallback(() => setPreset(null), [setPreset]);

  // Scroll lock and Escape handling while the preview overlay is open.
  useEffect(() => {
    if (!preset || isPreviewFrame) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [preset, isPreviewFrame, close]);

  // Track navigation performed inside the preview iframe.
  useEffect(() => {
    if (!preset) return;
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; path?: string } | null;
      if (data?.type === "estateflow:route" && typeof data.path === "string") {
        setFramePath(data.path);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [preset]);

  useLayoutEffect(() => {
    if (!preset || isPreviewFrame) return;
    const element = canvasRef.current;
    if (!element) return;

    const measure = () => {
      const bounds = element.getBoundingClientRect();
      const size = PREVIEW_PRESETS[preset];
      const availableWidth = Math.max(bounds.width - 64, 240);
      const availableHeight = Math.max(bounds.height - 64, 240);
      const next = Math.min(
        availableWidth / size.width,
        availableHeight / size.height,
        1,
      );
      setScale(Math.max(next, 0.18));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [preset, isPreviewFrame]);

  const value = useMemo(
    () => ({ preset, enabled, isPreviewFrame, setPreset, close }),
    [preset, enabled, isPreviewFrame, setPreset, close],
  );

  const active = preset && !isPreviewFrame ? PREVIEW_PRESETS[preset] : null;

  const frameParams = new URLSearchParams(search);
  frameParams.set("preview", "1");
  const frameSrc = `${pathname}?${frameParams.toString()}`;

  return (
    <PreviewContext.Provider value={value}>
      {children}

      {active && preset ? (
        <div
          className="fixed inset-0 z-[95] flex flex-col bg-[#e9e7e2] dark:bg-[#0a0b0c]"
          role="dialog"
          aria-modal="true"
          aria-label="Responsive viewport preview"
        >
          <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-4 py-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-2.5">
              <EstateFlowLogo variant="symbol" height={30} />
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-[13px] font-semibold leading-4 text-ink">
                  Viewport preview
                </p>
                <p className="truncate text-[11px] leading-4 text-muted">
                  Same app, same routes, real breakpoints
                </p>
              </div>
            </div>

            <div className="order-3 w-full sm:order-none sm:w-auto">
              <SegmentedControl<PreviewPreset>
                value={preset}
                onChange={(next) => setPreset(next)}
                ariaLabel="Preview viewport size"
                className="w-full sm:w-auto"
                options={[
                  {
                    value: "desktop",
                    label: "Desktop",
                    icon: <Monitor className="h-3.5 w-3.5" aria-hidden="true" />,
                  },
                  {
                    value: "tablet",
                    label: "Tablet",
                    icon: <Tablet className="h-3.5 w-3.5" aria-hidden="true" />,
                  },
                  {
                    value: "mobile",
                    label: "Mobile",
                    icon: <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />,
                  },
                ]}
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="hidden rounded-md border border-border bg-surface-2 px-2 py-1 text-[11px] font-medium tabular-nums text-ink-2 md:inline">
                {active.width} × {active.height} · {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => {
                  router.push(framePath || pathname);
                  setPreset(null);
                }}
                className={buttonClasses("secondary", "sm")}
              >
                <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Full width</span>
              </button>
              <button
                type="button"
                onClick={close}
                className={buttonClasses("ghost", "icon")}
                aria-label="Close viewport preview"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div
            ref={canvasRef}
            className="flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-8"
          >
            <div
              className="relative shrink-0"
              style={{
                width: active.width * scale,
                height: active.height * scale,
              }}
            >
              <div
                className="absolute left-0 top-0 overflow-hidden rounded-[16px] border border-border-strong bg-bg shadow-pop"
                style={
                  {
                    width: active.width,
                    height: active.height,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                  } as CSSProperties
                }
              >
                <iframe
                  key={preset}
                  title={`EstateFlow ${active.label.toLowerCase()} preview`}
                  src={frameSrc}
                  width={active.width}
                  height={active.height}
                  className="block border-0 bg-bg"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-surface px-4 py-2.5 text-[11px] text-muted sm:px-5">
            <p className="flex items-center gap-1.5">
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
              Navigate inside the frame to inspect every route.
            </p>
            <p className="tabular-nums">
              {active.hint} · {active.width} × {active.height} CSS px
            </p>
          </div>
        </div>
      ) : null}
    </PreviewContext.Provider>
  );
}

export function usePreview(): PreviewContextValue {
  const context = useContext(PreviewContext);
  if (!context) throw new Error("usePreview must be used inside <PreviewProvider>.");
  return context;
}

/** Reports the current route to the parent window when running in a preview iframe. */
export function usePreviewRouteReporter() {
  const pathname = usePathname();
  const { isPreviewFrame } = usePreview();

  useEffect(() => {
    if (!isPreviewFrame || window.parent === window) return;
    window.parent.postMessage(
      { type: "estateflow:route", path: `${pathname}${window.location.search}` },
      window.location.origin,
    );
  }, [pathname, isPreviewFrame]);
}

export const previewHint = cn(
  "text-[11px] leading-4 text-muted",
);
