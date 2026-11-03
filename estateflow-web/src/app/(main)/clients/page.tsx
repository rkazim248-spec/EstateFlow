"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Plus, Search, SlidersHorizontal, Users, X } from "lucide-react";

import { useData } from "@/lib/data-context";
import { deleteClient } from "@/lib/data";
import { describeDataError } from "@/lib/errors";
import {
  CLIENT_SORT_OPTIONS,
  clientFiltersFromParams,
  countActiveFilters,
  filterClients,
  isClientSort,
  sortClients,
  type ClientFilterState,
} from "@/lib/filtering";
import { formatPkr } from "@/lib/money";
import type { ClientRecord } from "@/lib/types";
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  InlineNotice,
  Input,
  PageHeader,
  Select,
  Skeleton,
  useToast,
} from "@/components/ui";
import { ClientCard } from "@/components/clients/client-card";
import { ClientFiltersDialog } from "@/components/clients/filters-dialog";

const FILTER_KEYS: Array<keyof ClientFilterState> = [
  "q",
  "purpose",
  "type",
  "status",
  "location",
  "bedrooms",
  "minBudget",
  "maxBudget",
];

function ClientsPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { toast } = useToast();
  const { clients, clientsLoading, error, retry } = useData();

  const searchParams = new URLSearchParams(params.toString());
  const filters = clientFiltersFromParams(searchParams);
  const sortParam = searchParams.get("sort");
  const sort = isClientSort(sortParam) ? sortParam : "recent";

  const [searchValue, setSearchValue] = useState(filters.q);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ClientRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setSearchValue(filters.q);
  }, [filters.q]);

  function updateParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function applyFilters(next: ClientFilterState) {
    const patch: Record<string, string | null> = {};
    for (const key of FILTER_KEYS) patch[key] = next[key] || null;
    updateParams(patch);
  }

  function clearFilters() {
    const patch: Record<string, string | null> = {};
    for (const key of FILTER_KEYS) patch[key] = null;
    updateParams(patch);
  }

  const list = clients ?? [];
  const filtered = useMemo(
    () => sortClients(filterClients(list, filters), sort),
    [list, filters, sort],
  );

  const activeCount =
    countActiveFilters(filters as unknown as Record<string, string>, ["q"]) +
    (filters.q ? 1 : 0);

  const chips: Array<{ key: keyof ClientFilterState; label: string }> = [];
  if (filters.q) chips.push({ key: "q", label: `Search: ${filters.q}` });
  if (filters.purpose) chips.push({ key: "purpose", label: filters.purpose });
  if (filters.type) chips.push({ key: "type", label: `Type: ${filters.type}` });
  if (filters.status) chips.push({ key: "status", label: `Status: ${filters.status}` });
  if (filters.bedrooms) chips.push({ key: "bedrooms", label: `Bedrooms: ${filters.bedrooms}` });
  if (filters.location) chips.push({ key: "location", label: `Location: ${filters.location}` });
  if (filters.minBudget)
    chips.push({ key: "minBudget", label: `Min budget: ${formatPkr(Number(filters.minBudget))}` });
  if (filters.maxBudget)
    chips.push({ key: "maxBudget", label: `Max budget: ${formatPkr(Number(filters.maxBudget))}` });

  async function handleDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteClient(pendingDelete.id);
      toast({
        variant: "success",
        title: "Client deleted",
        description: `${pendingDelete.name} was removed from Firestore.`,
      });
      setPendingDelete(null);
    } catch (deleteError) {
      toast({
        variant: "error",
        title: "Could not delete the client",
        description: describeDataError(deleteError),
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Clients"
        description={
          clientsLoading
            ? "Loading your clients from Firestore…"
            : activeCount > 0
              ? `${filtered.length} of ${list.length} clients match your filters.`
              : `${list.length} client${list.length === 1 ? "" : "s"}.`
        }
        actions={
          <Link
            href="/clients/new"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-field bg-accent px-4 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add client
          </Link>
        }
      />

      {error ? (
        <div className="mb-5">
          <InlineNotice
            tone="danger"
            title="Could not load clients"
            action={
              <Button variant="secondary" size="sm" onClick={retry}>
                Retry
              </Button>
            }
          >
            {error}
          </InlineNotice>
        </div>
      ) : null}

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={searchValue}
            onChange={(event) => {
              setSearchValue(event.target.value);
              updateParams({ q: event.target.value || null });
            }}
            placeholder="Search name, phone, area, requirements…"
            aria-label="Search clients"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setFiltersOpen(true)}
            aria-expanded={filtersOpen}
            icon={<SlidersHorizontal className="h-4 w-4" aria-hidden="true" />}
            className="shrink-0"
          >
            Filters
            {activeCount > 0 ? (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-semibold text-accent-ink tnum">
                {activeCount}
              </span>
            ) : null}
          </Button>
          <Select
            value={sort}
            onChange={(event) => updateParams({ sort: event.target.value })}
            aria-label="Sort clients"
            className="w-full sm:w-[196px]"
          >
            {CLIENT_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {chips.length > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => updateParams({ [chip.key]: null })}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-2 transition-colors hover:border-border-strong hover:text-ink"
              aria-label={`Remove filter ${chip.label}`}
            >
              {chip.label}
              <X className="h-3 w-3 text-muted" aria-hidden="true" />
            </button>
          ))}
          <button
            type="button"
            onClick={clearFilters}
            className="ml-1 text-[11px] font-medium text-accent underline-offset-4 hover:underline"
          >
            Clear all
          </button>
        </div>
      ) : null}

      {clientsLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Skeleton key={index} className="h-[248px] w-full rounded-card" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" aria-hidden="true" />}
          title="No clients yet"
          description="Add a buyer or renter to start properties. New accounts start empty — nothing is seeded."
          action={
            <Link
              href="/clients/new"
              className="inline-flex h-10 items-center gap-2 rounded-field bg-accent px-4 text-sm font-medium text-accent-ink"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add client
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="h-5 w-5" aria-hidden="true" />}
          title="No clients match these filters"
          description="Remove a filter or widen the budget range."
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-3 flex items-center gap-2">
            <Badge tone="neutral">
              {filtered.length} result{filtered.length === 1 ? "" : "s"}
            </Badge>
            {activeCount > 0 ? (
              <span className="text-[11px] text-muted">Filtered view</span>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((client) => (
              <ClientCard key={client.id} client={client} onDelete={setPendingDelete} />
            ))}
          </div>
        </>
      )}

      <ClientFiltersDialog
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onApply={applyFilters}
        onClear={clearFilters}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void handleDelete()}
        title="Delete this client?"
        description={
          pendingDelete
            ? `${pendingDelete.name} will be permanently removed for every signed-in EstateFlow client.`
            : ""
        }
        confirmLabel="Delete client"
        loading={deleting}
      />
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Skeleton key={index} className="h-[248px] w-full rounded-card" />
          ))}
        </div>
      }
    >
      <ClientsPageInner />
    </Suspense>
  );
}
