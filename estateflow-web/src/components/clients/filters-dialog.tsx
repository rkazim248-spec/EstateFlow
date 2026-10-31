"use client";

import { useEffect, useState } from "react";

import {
  BEDROOM_OPTIONS,
  CLIENT_PURPOSES,
  CLIENT_STATUSES,
  PROPERTY_TYPES,
} from "@/lib/constants";
import { EMPTY_CLIENT_FILTERS, type ClientFilterState } from "@/lib/filtering";
import { Button, Field, Input, Modal, Select } from "@/components/ui";

function rangeError(min: string, max: string): string | null {
  if (!min || !max) return null;
  if (Number(min) > Number(max)) return "Minimum budget is greater than maximum budget.";
  return null;
}

export function ClientFiltersDialog({
  open,
  onClose,
  filters,
  onApply,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  filters: ClientFilterState;
  onApply: (next: ClientFilterState) => void;
  onClear: () => void;
}) {
  const [draft, setDraft] = useState<ClientFilterState>(filters);

  useEffect(() => {
    if (open) setDraft(filters);
    // Only seed the draft when the dialog opens; live parent renders should
    // not discard the user's in-progress filter edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function set<K extends keyof ClientFilterState>(key: K, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  const validationError = rangeError(draft.minBudget, draft.maxBudget);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Filter clients"
      description="Budget ranges use the normalised PKR value, whether the client wants to buy or rent."
      size="lg"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              setDraft(EMPTY_CLIENT_FILTERS);
              onClear();
              onClose();
            }}
          >
            Clear all
          </Button>
          <Button
            onClick={() => {
              if (validationError) return;
              onApply(draft);
              onClose();
            }}
            disabled={Boolean(validationError)}
          >
            Apply filters
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Intent" htmlFor="client-filter-purpose">
          <Select
            id="client-filter-purpose"
            value={draft.purpose}
            onChange={(event) => set("purpose", event.target.value)}
          >
            <option value="">Any intent</option>
            {CLIENT_PURPOSES.map((purpose) => (
              <option key={purpose} value={purpose}>
                {purpose}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Preferred property type" htmlFor="client-filter-type">
          <Select
            id="client-filter-type"
            value={draft.type}
            onChange={(event) => set("type", event.target.value)}
          >
            <option value="">Any type</option>
            {PROPERTY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Status" htmlFor="client-filter-status">
          <Select
            id="client-filter-status"
            value={draft.status}
            onChange={(event) => set("status", event.target.value)}
          >
            <option value="">Any status</option>
            {CLIENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Bedrooms" htmlFor="client-filter-bedrooms">
          <Select
            id="client-filter-bedrooms"
            value={draft.bedrooms}
            onChange={(event) => set("bedrooms", event.target.value)}
          >
            <option value="">Any configuration</option>
            {BEDROOM_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Location contains" htmlFor="client-filter-location" className="sm:col-span-2">
          <Input
            id="client-filter-location"
            value={draft.location}
            onChange={(event) => set("location", event.target.value)}
            placeholder="e.g. Bahria Town"
          />
        </Field>

        <Field
          label="Minimum budget (PKR)"
          htmlFor="client-filter-min-budget"
          hint="Normalised total for buyers, monthly for renters."
        >
          <Input
            id="client-filter-min-budget"
            type="number"
            inputMode="numeric"
            min={0}
            value={draft.minBudget}
            onChange={(event) => set("minBudget", event.target.value)}
            placeholder="0"
          />
        </Field>

        <Field label="Maximum budget (PKR)" htmlFor="client-filter-max-budget">
          <Input
            id="client-filter-max-budget"
            type="number"
            inputMode="numeric"
            min={0}
            value={draft.maxBudget}
            onChange={(event) => set("maxBudget", event.target.value)}
            placeholder="No maximum"
          />
        </Field>

        {validationError ? (
          <p role="alert" className="text-xs leading-5 text-danger sm:col-span-2">
            {validationError}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
