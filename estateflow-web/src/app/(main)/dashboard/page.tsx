"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Home,
  KeyRound,
  Plus,
  Tag,
  Users,
  UserCheck,
} from "lucide-react";

import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data-context";
import { formatAmountWithUnit, formatPkr, relativeDate } from "@/lib/money";
import { Badge, Button, Card, EmptyState, InlineNotice, PageHeader, SectionHeading, Skeleton, statusTone } from "@/components/ui";
import { cn } from "@/lib/cn";

function sortRecent<T extends { createdAt: Date | null; name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aTime = a.createdAt?.getTime() ?? 0;
    const bTime = b.createdAt?.getTime() ?? 0;
    if (aTime !== bTime) return bTime - aTime;
    return a.name.localeCompare(b.name);
  });
}

function MetricCard({
  label,
  value,
  caption,
  href,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number;
  caption: string;
  href: string;
  icon: typeof Building2;
  loading: boolean;
}) {
  return (
    <Link
      href={href}
      className="group rounded-card border border-border bg-surface p-4 transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
          {label}
        </p>
        <Icon
          className="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-accent"
          strokeWidth={1.8}
          aria-hidden="true"
        />
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-14" />
      ) : (
        <p className="mt-3 text-[30px] font-semibold leading-none tracking-[-0.03em] text-ink tnum">
          {value}
        </p>
      )}
      <p className="mt-2 text-[11px] leading-4 text-muted">{caption}</p>
    </Link>
  );
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const { properties, clients, propertiesLoading, clientsLoading, error, retry } =
    useData();

  const loading = propertiesLoading || clientsLoading;
  const propertyList = properties ?? [];
  const clientList = clients ?? [];

  const totalProperties = propertyList.length;
  const forRent = propertyList.filter((property) => property.purpose === "Rent").length;
  const forSale = propertyList.filter((property) => property.purpose === "Sell").length;
  const totalClients = clientList.length;
  const buyers = clientList.filter((client) => client.purpose === "Want to Buy").length;
  const renters = clientList.filter((client) => client.purpose === "Want to Rent").length;

  const recentProperties = sortRecent(propertyList).slice(0, 4);
  const recentClients = sortRecent(clientList).slice(0, 4);
  const firstName =
    (profile?.name || user?.displayName || "").trim().split(/\s+/)[0] || null;

  return (
    <div>
      <PageHeader
        title={firstName ? `Good to see you, ${firstName}` : "Dashboard"}
        description="Live totals from your Firebase records. Buyer and rental counts reflect stated intent, not completed transactions."
        actions={
          <>
            <Link
              href="/clients/new"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-field border border-border-strong bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add client
            </Link>
            <Link
              href="/properties/new"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-field bg-accent px-4 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-hover"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add property
            </Link>
          </>
        }
      />

      {error ? (
        <div className="mb-5">
          <InlineNotice
            tone="danger"
            title="Could not load your workspace"
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

      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="sr-only">
          Workspace totals
        </h2>
        <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            label="Total properties"
            value={totalProperties}
            caption="Every listing in the workspace"
            href="/properties"
            icon={Building2}
            loading={propertiesLoading}
          />
          <MetricCard
            label="For rent"
            value={forRent}
            caption="Listings offered for rent"
            href="/properties?purpose=Rent"
            icon={KeyRound}
            loading={propertiesLoading}
          />
          <MetricCard
            label="For sale"
            value={forSale}
            caption="Listings offered for sale"
            href="/properties?purpose=Sell"
            icon={Tag}
            loading={propertiesLoading}
          />
          <MetricCard
            label="Total clients"
            value={totalClients}
            caption="Buyers and renters combined"
            href="/clients"
            icon={Users}
            loading={clientsLoading}
          />
          <MetricCard
            label="Buyer clients"
            value={buyers}
            caption="Clients with “Want to Buy” intent"
            href="/clients?purpose=Want%20to%20Buy"
            icon={UserCheck}
            loading={clientsLoading}
          />
          <MetricCard
            label="Rental clients"
            value={renters}
            caption="Clients with “Want to Rent” intent"
            href="/clients?purpose=Want%20to%20Rent"
            icon={Home}
            loading={clientsLoading}
          />
        </div>
      </section>

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <Card className="min-w-0">
          <div className="px-4 pb-3 pt-4 sm:px-5">
            <SectionHeading
              title="Recent properties"
              description="Newest records first; older mobile records fall back to name order."
              action={
                <Link
                  href="/properties"
                  className="inline-flex items-center gap-1 text-[12px] font-medium text-accent underline-offset-4 hover:underline"
                >
                  View all
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              }
            />
          </div>
          <div className="px-2 pb-2 sm:px-3">
            {propertiesLoading ? (
              <div className="space-y-1 p-2">
                {[0, 1, 2, 3].map((index) => (
                  <Skeleton key={index} className="h-14 w-full" />
                ))}
              </div>
            ) : recentProperties.length === 0 ? (
              <div className="p-3">
                <EmptyState
                  icon={<Building2 className="h-5 w-5" aria-hidden="true" />}
                  title="No properties yet"
                  description="Add your first listing to see it here and in the mobile app."
                  action={
                    <Link
                      href="/properties/new"
                      className="inline-flex h-9 items-center gap-1.5 rounded-field bg-accent px-3 text-[13px] font-medium text-accent-ink"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      Add property
                    </Link>
                  }
                />
              </div>
            ) : (
              <ul>
                {recentProperties.map((property) => (
                  <li key={property.id}>
                    <Link
                      href={`/properties/${property.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-ink">
                          {property.name}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-muted">
                          {property.location || "No location"} · {property.type}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[12px] font-medium text-ink tnum">
                          {formatAmountWithUnit(property.price, property.priceUnit)}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted">
                          {property.createdAt
                            ? relativeDate(property.createdAt)
                            : property.status}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card className="min-w-0">
          <div className="px-4 pb-3 pt-4 sm:px-5">
            <SectionHeading
              title="Recent clients"
              description="Follow-up state as recorded, never inferred from matches."
              action={
                <Link
                  href="/clients"
                  className="inline-flex items-center gap-1 text-[12px] font-medium text-accent underline-offset-4 hover:underline"
                >
                  View all
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              }
            />
          </div>
          <div className="px-2 pb-2 sm:px-3">
            {clientsLoading ? (
              <div className="space-y-1 p-2">
                {[0, 1, 2, 3].map((index) => (
                  <Skeleton key={index} className="h-14 w-full" />
                ))}
              </div>
            ) : recentClients.length === 0 ? (
              <div className="p-3">
                <EmptyState
                  icon={<Users className="h-5 w-5" aria-hidden="true" />}
                  title="No clients yet"
                  description="Add a buyer or renter to start."
                  action={
                    <Link
                      href="/clients/new"
                      className="inline-flex h-9 items-center gap-1.5 rounded-field bg-accent px-3 text-[13px] font-medium text-accent-ink"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      Add client
                    </Link>
                  }
                />
              </div>
            ) : (
              <ul>
                {recentClients.map((client) => (
                  <li key={client.id}>
                    <Link
                      href={`/clients/${client.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-ink">
                          {client.name}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-muted">
                          {client.purpose} · {client.location || "Any location"}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <p className="text-[12px] font-medium text-ink tnum">
                          {formatAmountWithUnit(client.budget, client.budgetUnit)}
                        </p>
                        <Badge tone={statusTone(client.status)}>{client.status}</Badge>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      {!loading && propertyList.length === 0 && clientList.length === 0 ? (
        <div className="mt-5">
          <InlineNotice tone="info" title="Your workspace is empty">
            Nothing has been seeded. New accounts start with no demo records —
            create a property or a client, or add records in the mobile app and
            they will appear here automatically.
          </InlineNotice>
        </div>
      ) : null}

      <p className={cn("mt-6 text-[11px] leading-5 text-muted")}>
        {loading
          ? "Listening for changes in Firestore…"
          : `${totalProperties} propert${totalProperties === 1 ? "y" : "ies"} · ${totalClients} client${totalClients === 1 ? "" : "s"} · prices normalised to ${formatPkr(100_000)} per Lakh.`}
      </p>
    </div>
  );
}
