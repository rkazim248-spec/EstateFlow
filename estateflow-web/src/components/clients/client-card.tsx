"use client";

import { Phone, MoreHorizontal, Pencil, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge, Button, statusTone } from "@/components/ui";
import { Popover } from "@/components/layout/popover";
import { formatAmountWithUnit, formatPkr } from "@/lib/money";
import { typeUsesBedrooms } from "@/lib/constants";
import { resolvedBedrooms, type ClientRecord } from "@/lib/types";

export function ClientCard({
  client,
  onDelete,
}: {
  client: ClientRecord;
  onDelete: (client: ClientRecord) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const showBedrooms =
    typeUsesBedrooms(client.type) && Boolean(resolvedBedrooms(client));

  return (
    <article className="flex h-full min-w-0 flex-col rounded-card border border-border bg-surface transition-colors hover:border-border-strong">
      <div className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Badge tone={client.purpose === "Want to Buy" ? "accent" : "info"}>
            {client.purpose}
          </Badge>
          <Badge tone={statusTone(client.status)} dot>
            {client.status}
          </Badge>
        </div>

        <h3 className="mt-3 break-words text-[15px] font-semibold leading-snug tracking-[-0.01em] text-ink">
          <Link
            href={`/clients/${client.id}`}
            className="underline-offset-4 hover:underline"
          >
            {client.name}
          </Link>
        </h3>

        <a
          href={`tel:${client.phone.replace(/\s/g, "")}`}
          className="mt-1 flex min-w-0 items-center gap-1 text-[12px] text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{client.phone}</span>
        </a>

        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="text-[18px] font-semibold tracking-[-0.02em] text-ink tnum">
            {formatAmountWithUnit(client.budget, client.budgetUnit)}
          </p>
          <p className="text-[11px] text-muted tnum">≈ {formatPkr(client.normalizedBudget)}</p>
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border pt-3">
          <div className="min-w-0">
            <dt className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted">
              Preferred area
            </dt>
            <dd className="mt-0.5 truncate text-[12px] font-medium text-ink-2">
              {client.location || "Any"}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted">
              {showBedrooms ? `${client.type} · bedrooms` : client.type}
            </dt>
            <dd className="mt-0.5 truncate text-[12px] font-medium text-ink-2">
              {showBedrooms ? resolvedBedrooms(client) : "—"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-auto flex items-center gap-0.5 border-t border-border px-2 py-1.5">
        <Link
          href={`/clients/${client.id}`}
          className="inline-flex h-8 items-center rounded-lg px-2.5 text-[12px] font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
        >
          View
        </Link>
        <Link
          href={`/clients/${client.id}/edit`}
          className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[12px] font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <Pencil className="h-3 w-3" aria-hidden="true" />
          Edit
        </Link>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`More actions for ${client.name}`}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
          className="h-8 w-8"
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        </Button>
        <button
          type="button"
          onClick={() => {
            setMenuOpen(false);
            onDelete(client);
          }}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-danger transition-colors hover:bg-danger-soft"
          role="menuitem"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Delete client
        </button>
      </div>
    </article>
  );
}