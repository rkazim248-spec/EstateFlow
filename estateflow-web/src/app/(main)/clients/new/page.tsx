"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/ui";
import { ClientForm } from "@/components/clients/client-form";

export default function NewClientPage() {
  return (
    <div>
      <Link
        href="/clients"
        className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-muted underline-offset-4 hover:text-ink hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        All clients
      </Link>
      <PageHeader
        title="Add client"
        description="Saved to the same `clients` collection the mobile app reads."
      />
      <ClientForm mode="create" />
    </div>
  );
}
