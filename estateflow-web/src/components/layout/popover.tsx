"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

import { cn } from "@/lib/cn";

/** Closes a popover when the user clicks outside it or presses Escape. */
export function useDismissable(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
) {
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const element = ref.current;
      if (element && !element.contains(event.target as Node)) onClose();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [ref, open, onClose]);
}

export function Popover({
  open,
  onClose,
  trigger,
  children,
  align = "end",
  className,
  panelClassName,
}: {
  open: boolean;
  onClose: () => void;
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "end";
  className?: string;
  panelClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useDismissable(ref, open, onClose);

  return (
    <div ref={ref} className={cn("relative", className)}>
      {trigger}
      {open ? (
        <div
          className={cn(
            "absolute top-[calc(100%+8px)] z-50 min-w-[240px] animate-scale-in rounded-card border border-border bg-surface p-1.5 shadow-pop",
            align === "end" ? "right-0" : "left-0",
            panelClassName,
          )}
          role="menu"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function MenuItem({
  children,
  onClick,
  href,
  danger = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
}) {
  const classes = cn(
    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors",
    danger
      ? "text-danger hover:bg-danger-soft"
      : "text-ink-2 hover:bg-surface-2 hover:text-ink",
  );

  if (href) {
    return (
      <a href={href} className={classes} role="menuitem">
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classes} role="menuitem">
      {children}
    </button>
  );
}

export function useLocalStorageBoolean(key: string, fallback: boolean) {
  const [value, setValue] = useState(fallback);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored === "true") setValue(true);
      if (stored === "false") setValue(false);
    } catch {
      // ignore
    }
  }, [key]);

  function update(next: boolean) {
    setValue(next);
    try {
      window.localStorage.setItem(key, String(next));
    } catch {
      // ignore
    }
  }

  return [value, update] as const;
}
