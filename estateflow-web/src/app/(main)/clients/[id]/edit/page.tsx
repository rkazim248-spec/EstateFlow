"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";

import { useData } from "@/lib/data-context";
import { EmptyState, PageHeader, Skeleton } from "@/components/ui";
import { ClientForm } from "@/components/clients/client-form";

export default function EditClientPage() {
  const params = useParams<{ id: string }>();
  const { clients, clientsLoading } = useData();
  const id = typeof params.id === "string" ? params.id : "";
  const client = clients?.find((item) => item.id === id) ?? null;

  if (clientsLoading && !client) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-card" />
      </div>
    );
  }

  if (!client) {
    return (
      <EmptyState
        icon={<Pencil className="h-5 w-5" aria-hidden="true" />}
        title="Client not found"
        description="They may have been deleted, or the link is incorrect."
        action={
          <Link
            href="/clients"
            className="inline-flex h-10 items-center gap-2 rounded-field bg-accent px-4 text-sm font-medium text-accent-ink"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            All clients
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <Link
        href={`/clients/${client.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-muted underline-offset-4 hover:text-ink hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to client
      </Link>
      <PageHeader
        title="Edit client"
        description={`Changes are saved to the shared Firestore record for “${client.name}”.`}
      />
      <ClientForm mode="edit" client={client} />
    </div>
  );
}
