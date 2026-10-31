"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  MapPin,
  Pencil,
  Phone,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";

import { useData } from "@/lib/data-context";
import { deleteProperty } from "@/lib/data";
import { describeDataError } from "@/lib/errors";
import {
  formatAmountWithUnit,
  formatDateTime,
  formatNumberPK,
  formatPkr,
} from "@/lib/money";
import { typeUsesBedrooms, AREA_UNIT_LABELS } from "@/lib/constants";
import { resolvedBedrooms, type PropertyRecord } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  PageHeader,
  SectionHeading,
  Skeleton,
  statusTone,
  useToast,
} from "@/components/ui";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-b border-border py-2.5 last:border-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 break-words text-[13px] leading-5 text-ink">{value}</dd>
    </div>
  );
}

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { properties, propertiesLoading } = useData();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const id = typeof params.id === "string" ? params.id : "";
  const property: PropertyRecord | null =
    properties?.find((item) => item.id === id) ?? null;

  async function handleDelete() {
    if (!property) return;
    setDeleting(true);
    try {
      await deleteProperty(property.id);
      toast({
        variant: "success",
        title: "Property deleted",
        description: `${property.name} was removed from Firestore.`,
      });
      router.push("/properties");
    } catch (error) {
      toast({
        variant: "error",
        title: "Could not delete the property",
        description: describeDataError(error),
      });
      setDeleting(false);
    }
  }

  if (propertiesLoading && !property) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full rounded-card" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-card lg:col-span-2" />
          <Skeleton className="h-72 rounded-card" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <EmptyState
        icon={<Building2 className="h-5 w-5" aria-hidden="true" />}
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

  const showBedrooms =
    typeUsesBedrooms(property.type) && Boolean(resolvedBedrooms(property));

  return (
    <div>
      <Link
        href="/properties"
        className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-muted underline-offset-4 hover:text-ink hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        All properties
      </Link>

      <PageHeader
        title={property.name}
        description={property.location || "No location recorded"}
        actions={
          <>
            <Link
              href={`/properties/${property.id}/edit`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-field border border-border-strong bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit property
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </Link>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete property"
              onClick={() => setConfirmOpen(true)}
              className="text-danger hover:bg-danger-soft"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-1.5">
        <Badge tone="neutral">{property.type}</Badge>
        <Badge tone="accent">
          {property.purpose === "Rent" ? "For rent" : "For sale"}
        </Badge>
        <Badge tone={statusTone(property.status)} dot>
          {property.status}
        </Badge>
        {property.ownerId ? null : (
          <Badge tone="warning">Legacy record · no owner id</Badge>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <SectionHeading title="Listing details" />
            <dl className="mt-2 grid gap-x-6 sm:grid-cols-2">
              <DetailRow label="Property type" value={property.type} />
              <DetailRow
                label="Purpose"
                value={property.purpose === "Rent" ? "For rent" : "For sale"}
              />
              <DetailRow label="Status" value={property.status} />
              <DetailRow
                label="Area"
                value={`${formatNumberPK(property.area)} ${AREA_UNIT_LABELS[property.areaUnit] ?? property.areaUnit}`}
              />
              <DetailRow
                label="Bedrooms"
                value={showBedrooms ? resolvedBedrooms(property) : "Not applicable"}
              />
              <DetailRow
                label="Location"
                value={property.location || "Not recorded"}
              />
            </dl>
          </Card>

          <Card className="p-4 sm:p-5">
            <SectionHeading
              title="Owner"
              description="Recorded contact details and conditions."
            />
            <dl className="mt-2">
              <DetailRow label="Owner name" value={property.ownerName || "Not recorded"} />
              <div className="border-b border-border py-2.5">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                  Owner phone
                </dt>
                <dd className="mt-0.5 text-[13px] leading-5 text-ink">
                  {property.ownerPhone ? (
                    <a
                      href={`tel:${property.ownerPhone.replace(/\s/g, "")}`}
                      className="inline-flex items-center gap-1.5 text-accent underline-offset-4 hover:underline"
                    >
                      <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                      {property.ownerPhone}
                    </a>
                  ) : (
                    "Not recorded"
                  )}
                </dd>
              </div>
              <DetailRow
                label="Owner conditions"
                value={property.ownerCondition || "No conditions recorded"}
              />
            </dl>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
              Asking price
            </p>
            <p className="mt-1 text-[24px] font-semibold leading-tight tracking-[-0.02em] text-ink tnum">
              {formatAmountWithUnit(property.price, property.priceUnit)}
            </p>
            <p className="mt-1 text-[12px] text-muted tnum">
              ≈ {formatPkr(property.normalizedPrice)}
              {property.purpose === "Rent" ? " per month" : " total"}
            </p>
            <p className="mt-3 border-t border-border pt-3 text-[11px] leading-5 text-muted">
              Normalised to PKR for sorting and filtering. The stored
              amount and unit are shown above exactly as entered.
            </p>
          </Card>

          <Card className="p-4 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
              Record
            </p>
            <ul className="mt-2 space-y-2.5 text-[12px] text-ink-2">
              <li className="flex items-start gap-2">
                <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
                <span>
                  <span className="block text-[10px] uppercase tracking-[0.1em] text-muted">
                    Added
                  </span>
                  {formatDateTime(property.createdAt)}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
                <span>
                  <span className="block text-[10px] uppercase tracking-[0.1em] text-muted">
                    Last updated
                  </span>
                  {formatDateTime(property.updatedAt)}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
                <span>
                  <span className="block text-[10px] uppercase tracking-[0.1em] text-muted">
                    Owner id
                  </span>
                  <span className="break-all font-mono text-[10.5px]">
                    {property.ownerId ?? "Not set on this legacy record"}
                  </span>
                </span>
              </li>
            </ul>
          </Card>

          <Card className="p-4 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
              Quick actions
            </p>
            <div className="mt-2 space-y-2">
              <Link
                href="/properties"
                className="flex w-full items-center gap-2 rounded-field border border-border px-3 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-surface-2"
              >
                Browse properties
              </Link>
              <Link
                href="/properties/new"
                className="flex w-full items-center gap-2 rounded-field border border-border px-3 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-surface-2"
              >
                Add property
                <MapPin className="h-4 w-4 text-muted" aria-hidden="true" />
                Browse all properties
              </Link>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
        title="Delete this property?"
        description={`${property.name} will be permanently removed for every signed-in EstateFlow client.`}
        confirmLabel="Delete property"
        loading={deleting}
      />
    </div>
  );
}
