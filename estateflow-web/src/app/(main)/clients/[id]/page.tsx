"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { useData } from "@/lib/data-context";
import { deleteClient } from "@/lib/data";
import { describeDataError } from "@/lib/errors";
import { ArrowLeft, CalendarClock, MapPin, Pencil, Phone, Sparkles, Trash2, Users } from "lucide-react";
import { formatAmountWithUnit, formatDateTime, formatPkr } from "@/lib/money";
import { typeUsesBedrooms } from "@/lib/constants";
import { resolvedBedrooms, type ClientRecord } from "@/lib/types";
import { Badge, Button, Card, ConfirmDialog, EmptyState, PageHeader, SectionHeading, Skeleton, statusTone, useToast } from "@/components/ui";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-b border-border py-2.5 last:border-0">
      <dt className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 whitespace-pre-line break-words text-[13px] leading-5 text-ink">
        {value}
      </dd>
    </div>
  );
}

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { clients, clientsLoading } = useData();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const id = typeof params.id === "string" ? params.id : "";
  const client: ClientRecord | null =
    clients?.find((item) => item.id === id) ?? null;

  async function handleDelete() {
    if (!client) return;
    setDeleting(true);
    try {
      await deleteClient(client.id);
      toast({
        variant: "success",
        title: "Client deleted",
        description: `${client.name} was removed from Firestore.`,
      });
      router.push("/clients");
    } catch (error) {
      toast({
        variant: "error",
        title: "Could not delete the client",
        description: describeDataError(error),
      });
      setDeleting(false);
    }
  }

  if (clientsLoading && !client) {
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

  if (!client) {
    return (
      <EmptyState
        icon={<Users className="h-5 w-5" aria-hidden="true" />}
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

  const showBedrooms =
    typeUsesBedrooms(client.type) && Boolean(resolvedBedrooms(client));
  const isRent = client.purpose === "Want to Rent";

  return (
    <div className="space-y-4">
      <Link
        href="/clients"
        className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-muted underline-offset-4 hover:text-ink hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        All clients
      </Link>

      <PageHeader
        title={client.name}
        description={`${client.purpose} · ${client.location || "Any location"}`}
        actions={
          <>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span className="ml-2 text-[10px] font-medium text-ink">Match properties</span>
            <Link
              href={`/clients/${client.id}/edit`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-field bg-accent px-4 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-hover"
              >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </Link>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete client"
              onClick={() => setConfirmOpen(true)}
              className="text-danger hover:bg-danger-soft"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-1.5">
        <Badge tone={client.purpose === "Want to Buy" ? "accent" : "info"}>
          {client.purpose}
        </Badge>
        <Badge tone={statusTone(client.status)} dot>
          {client.status}
        </Badge>
        <Badge tone="neutral">{client.type}</Badge>
        {client.ownerId ? null : <Badge tone="warning">Legacy record · no owner id</Badge>}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <SectionHeading title="Contact and intent" />
            <dl className="mt-2 grid gap-x-6 sm:grid-cols-2">
              <div className="border-b border-border py-2.5">
                <dt className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
                  Phone
                </dt>
                <dd className="mt-0.5 text-[13px] leading-5">
                  <a
                    href={`tel:${client.phone.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-1.5 text-accent underline-offset-4 hover:underline"
                  >
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                    {client.phone}
                  </a>
                </dd>
              </div>
              <DetailRow label="Purpose" value={client.purpose} />
              <DetailRow label="Preferred property type" value={client.type} />
              <DetailRow
                label="Bedroom preference"
                value={showBedrooms ? resolvedBedrooms(client) : "Not applicable"}
              />
              <DetailRow
                label="Preferred location"
                value={client.location || "Any location"}
              />
              <DetailRow label="Status" value={client.status} />
            </dl>
          </Card>

          <Card className="p-4 sm:p-5">
            <SectionHeading title="Requirements" description="Free-text notes recorded by you. Matching only compares values that are reliable." />
            <dl className="mt-2">
              <DetailRow
                label="Client requirement"
                value={client.requirements || "No requirement text recorded"}
              />
              <DetailRow
                label="Client condition"
                value={client.condition || "No conditions recorded"}
              />
            </dl>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
              Budget
            </p>
            <p className="mt-1 text-[24px] font-semibold leading-tight tracking-[-0.02em] text-ink tnum">
              {formatAmountWithUnit(client.budget, client.budgetUnit)}
            </p>
            <p className="mt-1 text-[12px] text-muted tnum">
              ≈ {formatPkr(client.normalizedBudget)}
              {isRent ? " per month" : " total"}
            </p>
            <p className="mt-3 border-t border-border pt-3 text-[11px] leading-5 text-muted">
              A property matches the budget when its normalised price is at or
              below this figure. A match does not mean a deal has been agreed.
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
                  {formatDateTime(client.createdAt)}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
                <span>
                  <span className="block text-[10px] uppercase tracking-[0.1em] text-muted">
                    Last updated
                  </span>
                  {formatDateTime(client.updatedAt)}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
                <span>
                  <span className="block text-[10px] uppercase tracking-[0.1em] text-muted">
                    Record id
                  </span>
                  <span className="break-all font-mono text-[10.5px]">{client.id}</span>
                </span>
              </li>
            </ul>
          </Card>

          <Card className="p-4 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
              Status is manual
            </p>
            <p className="mt-2 text-[11px] leading-5 text-muted">
              EstateFlow never changes a client&apos;s status because a property
              was found. Update it yourself when the conversation actually moves
              forward.
            </p>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
        title="Delete this client?"
        description={`${client.name} will be permanently removed for every signed-in EstateFlow client.`}
        confirmLabel="Delete client"
        loading={deleting}
      />
    </div>
  );
}