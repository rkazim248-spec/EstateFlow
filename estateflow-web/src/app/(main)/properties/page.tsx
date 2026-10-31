"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Building2, Plus, Search, SlidersHorizontal, X } from "lucide-react";

import { useData } from "@/lib/data-context";
import { deleteProperty } from "@/lib/data";
import { describeDataError } from "@/lib/errors";
import {
  PROPERTY_SORT_OPTIONS,
  countActiveFilters,
  filterProperties,
  isPropertySort,
  propertyFiltersFromParams,
  sortProperties,
  type PropertyFilterState,
} from "@/lib/filtering";
import { formatPkr } from "@/lib/money";
import type { PropertyRecord } from "@/lib/types";
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
import { PropertyCard } from "@/components/properties/property-card";
import { PropertyFiltersDialog } from "@/components/properties/filters-dialog";

const FILTER_KEYS: Array<keyof PropertyFilterState> = [
  "q",
  "purpose",
  "type",
  "status",
  "location",
  "bedrooms",
  "minPrice",
  "maxPrice",
  "minArea",
  "maxArea",
  "areaUnit",
];

function PropertiesPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { toast } = useToast();
  const { properties, propertiesLoading, error, retry } = useData();

  const searchParams = new URLSearchParams(params.toString());
  const filters = propertyFiltersFromParams(searchParams);
  const sort = isPropertySort(searchParams.get("sort"))
    ? (searchParams.get("sort") as (typeof PROPERTY_SORT_OPTIONS)[number]["value"])
    : "recent";

  const [searchValue, setSearchValue] = useState(filters.q);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PropertyRecord | null>(null);
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

  function applyFilters(next: PropertyFilterState) {
    const patch: Record<string, string | null> = {};
    for (const key of FILTER_KEYS) {
      patch[key] = next[key] || null;
    }
    updateParams(patch);
  }

  function clearFilters() {
    const patch: Record<string, string | null> = {};
    for (const key of FILTER_KEYS) patch[key] = null;
    updateParams(patch);
  }

  const list = properties ?? [];
  const filtered = useMemo(
    () => sortProperties(filterProperties(list, filters), sort),
    [list, filters, sort],
  );

  const activeCount =
    countActiveFilters(filters as unknown as Record<string, string>, ["q"]) +
    (filters.q ? 1 : 0);

  const chips: Array<{ key: keyof PropertyFilterState; label: string }> = [];
  if (filters.q) chips.push({ key: "q", label: `Search: ${filters.q}` });
  if (filters.purpose)
    chips.push({
      key: "purpose",
      label: `Purpose: ${filters.purpose === "Rent" ? "For rent" : "For sale"}`,
    });
  if (filters.type) chips.push({ key: "type", label: `Type: ${filters.type}` });
  if (filters.status) chips.push({ key: "status", label: `Status: ${filters.status}` });
  if (filters.bedrooms) chips.push({ key: "bedrooms", label: `Bedrooms: ${filters.bedrooms}` });
  if (filters.location) chips.push({ key: "location", label: `Location: ${filters.location}` });
  if (filters.minPrice)
    chips.push({ key: "minPrice", label: `Min price: ${formatPkr(Number(filters.minPrice))}` });
  if (filters.maxPrice)
    chips.push({ key: "maxPrice", label: `Max price: ${formatPkr(Number(filters.maxPrice))}` });
  if (filters.areaUnit) chips.push({ key: "areaUnit", label: `Area unit: ${filters.areaUnit}` });
  if (filters.minArea) chips.push({ key: "minArea", label: `Min area: ${filters.minArea}` });
  if (filters.maxArea) chips.push({ key: "maxArea", label: `Max area: ${filters.maxArea}` });

  async function handleDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteProperty(pendingDelete.id);
      toast({
        variant: "success",
        title: "Property deleted",
        description: `${pendingDelete.name} was removed from Firestore.`,
      });
      setPendingDelete(null);
    } catch (deleteError) {
      toast({
        variant: "error",
        title: "Could not delete the property",
        description: describeDataError(deleteError),
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Properties"
        description={
          propertiesLoading
            ? "Loading your listings from Firestore…"
            : activeCount > 0
              ? `${filtered.length} of ${list.length} listings match your filters.`
              : `${list.length} listing${list.length === 1 ? "" : "s"} in the shared workspace.`
        }
        actions={
          <Link
            href="/properties/new"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-field bg-accent px-4 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-hover"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add property
          </Link>
        }
      />

      {error ? (
        <div className="mb-5">
          <InlineNotice
            tone="danger"
            title="Could not load properties"
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
            placeholder="Search name, location, owner, phone…"
            aria-label="Search properties"
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
            aria-label="Sort properties"
            className="w-full sm:w-[196px]"
          >
            {PROPERTY_SORT_OPTIONS.map((option) => (
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
              onClick={() =>
                updateParams({ [chip.key]: null, ...(chip.key === "q" ? { q: null } : {}) })
              }
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

      {propertiesLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Skeleton key={index} className="h-[268px] w-full rounded-card" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-5 w-5" aria-hidden="true" />}
          title="No properties yet"
          description="Create your first listing to see it here, on the dashboard, and in the mobile app. Nothing is seeded automatically."
          action={
            <Link
              href="/properties/new"
              className="inline-flex h-10 items-center gap-2 rounded-field bg-accent px-4 text-sm font-medium text-accent-ink"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add property
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Search className="h-5 w-5" aria-hidden="true" />}
          title="No properties match these filters"
          description="Remove a filter or widen the price or area range."
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
            {filtered.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onView={() => router.push(`/properties/${property.id}`)}
                onEdit={() => router.push(`/properties/${property.id}/edit`)}
                onDelete={() => setPendingDelete(property)}
              />
            ))}
          </div>
        </>
      )}

      <PropertyFiltersDialog
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
        title="Delete this property?"
        description={
          pendingDelete
            ? `${pendingDelete.name} will be permanently removed for every signed-in EstateFlow client.`
            : ""
        }
        confirmLabel="Delete property"
        loading={deleting}
      />
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Skeleton key={index} className="h-[268px] w-full rounded-card" />
          ))}
        </div>
      }
    >
      <PropertiesPageInner />
    </Suspense>
  );
}
