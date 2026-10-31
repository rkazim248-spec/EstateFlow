"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/lib/auth";
import { EstateFlowLogo } from "@/components/brand/estateflow-logo";
import { Spinner } from "@/components/ui";

export default function RootPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/dashboard" : "/login");
  }, [loading, user, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg" aria-busy="true">
      <div className="flex flex-col items-center gap-4">
        <EstateFlowLogo variant="full" height={42} href="/" />
        <Spinner />
      </div>
    </div>
  );
}
