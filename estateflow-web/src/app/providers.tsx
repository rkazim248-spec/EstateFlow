"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/lib/auth";
import { PreviewProvider } from "@/lib/preview";
import { ThemeProvider } from "@/lib/theme";
import { ToastProvider } from "@/components/ui";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <PreviewProvider>{children}</PreviewProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
