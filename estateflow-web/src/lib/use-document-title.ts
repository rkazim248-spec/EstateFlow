"use client";

import { useEffect } from "react";

/**
 * Keeps the browser tab title descriptive for client-rendered routes.
 * Server-rendered pages can still use Next's Metadata API.
 */
export function useDocumentTitle(title: string | null) {
  useEffect(() => {
    if (!title) return;

    const apply = () => {
      document.title = `${title} | EstateFlow`;
    };

    apply();
    // Next's metadata head can settle after the first effect on a hard reload.
    // Re-apply once the hydration pass has finished so the tab keeps the route title.
    const timer = window.setTimeout(apply, 100);
    return () => window.clearTimeout(timer);
  }, [title]);
}

const MAIN_ROUTES: Array<{ prefix: string; title: string }> = [
  { prefix: "/dashboard", title: "Dashboard" },
  { prefix: "/properties/new", title: "Add property" },
  { prefix: "/properties", title: "Properties" },
  { prefix: "/clients/new", title: "Add client" },
  { prefix: "/clients", title: "Clients" },
  { prefix: "/ai-studio", title: "AI Image Studio" },
  { prefix: "/media", title: "Media Library" },
  { prefix: "/social", title: "Social Media Hub" },
  { prefix: "/settings", title: "Settings" },
];

export function titleForPath(pathname: string): string {
  if (pathname.endsWith("/edit")) {
    if (pathname.startsWith("/properties/")) return "Edit property";
    if (pathname.startsWith("/clients/")) return "Edit client";
  }
  if (/^\/properties\/[^/]+$/.test(pathname) && pathname !== "/properties/new") {
    return "Property details";
  }
  if (/^\/clients\/[^/]+$/.test(pathname) && pathname !== "/clients/new") {
    return "Client details";
  }
  return (
    MAIN_ROUTES.find(
      (route) => pathname === route.prefix || pathname.startsWith(`${route.prefix}/`),
    )?.title ?? "EstateFlow"
  );
}
