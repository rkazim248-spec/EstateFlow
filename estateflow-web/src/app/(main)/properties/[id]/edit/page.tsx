"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";

import { useData } from "@/lib/data-context";
import { EmptyState, PageHeader, Skeleton } from "@/components/ui";
import { PropertyForm } from "@/components/properties/property-form";

export default function EditPropertyPage() {
  const params = useParams<{ id: string }>();
  const { properties, propertiesLoading } = useData();
  const id = typeof params.id === "string" ? params.id : "";
  const property = properties?.find((item) => item.id === id) ?? null;

  if (propertiesLoading && !property) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-card" />
      </div>
    );
  }

  if (!property) {
    return (
      <EmptyState
        icon={<Pencil className="h-5 w-5" aria-hidden="true" />}
        title="Property not found"
        description="It may have been deleted, or the link is incorrect."
        action={
          <Link
            href="/properties"
            className="inline-flex h-10 items-center gap-2 rounded-field bg-accent px-4 text-sm font-medium text-accent-ink"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            All properties
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <Link
        href={`/properties/${property.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-muted underline-offset-4 hover:text-ink hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to property
      </Link>
      <PageHeader
        title="Edit property"
        description={`Changes are saved to the shared Firestore record for “${property.name}”.`}
      />
      <PropertyForm mode="edit" property={property} />
    </div>
  );
}
