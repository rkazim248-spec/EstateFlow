"use client";

import { Pencil, Trash, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Badge, Button, statusTone } from "@/components/ui";
import { Popover } from "@/components/layout/popover";
import { formatPkr } from "@/lib/money";

import { type PropertyRecord } from "@/lib/types";

export function PropertyCard({
  property,
  onView,
  onEdit,
  onDelete,
  onMatch,
}: {
  property: PropertyRecord;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMatch?: () => void;
}) {
  return (
    <div className="flex h-full min-w-0 flex-col rounded-card border border-border bg-surface transition-colors hover:border-border-strong">
      <div className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Badge tone={property.purpose === "Sell" ? "accent" : "info"}>
            {property.purpose}
          </Badge>
          <Badge tone={statusTone(property.status)} dot>
            {property.status}
          </Badge>
        </div>

        <h3 className="mt-3 break-words text-[15px] font-semibold leading-snug tracking-[-0.01em] text-ink">
          <Link
            href={`/properties/${property.id}`}
            className="underline-offset-4 hover:underline"
          >
            {property.name}
          </Link>
        </h3>

        <p className="mt-1 text-[12px] text-muted">{property.location || "No location recorded"}</p>

        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="text-[18px] font-semibold tracking-[-0.02em] text-ink tnum">
            PKR {formatPkr(property.price)} {property.priceUnit}
          </p>
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border pt-3">
          <div className="min-w-0">
            <dt className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted">
              Type
            </dt>
            <dd className="mt-0.5 truncate text-[12px] font-medium text-ink-2">
              {property.type}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted">
              Area
            </dt>
            <dd className="mt-0.5 truncate text-[12px] font-medium text-ink-2">
              {property.area} {property.areaUnit}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-auto flex items-center gap-0.5 border-t border-border px-2 py-1.5">
        <Link
          href={`/properties/${property.id}`}
          className="inline-flex h-8 items-center rounded-lg px-2.5 text-[12px] font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
        >
          View
        </Link>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[12px] font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <Pencil className="h-3 w-3" aria-hidden="true" />
          Edit
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[12px] font-medium text-danger transition-colors hover:bg-danger-soft"
          >
            <Trash className="h-3 w-3" aria-hidden="true" />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}