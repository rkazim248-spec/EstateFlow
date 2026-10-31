"use client";

import { useEffect, useState } from "react";

import {
  AREA_UNITS,
  AREA_UNIT_LABELS,
  BEDROOM_OPTIONS,
  PROPERTY_PURPOSES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
} from "@/lib/constants";
import {
  EMPTY_PROPERTY_FILTERS,
  type PropertyFilterState,
} from "@/lib/filtering";
import { Button, Field, Input, Modal, Select } from "@/components/ui";

function rangeError(min: string, max: string, label: string): string | null {
  if (!min || !max) return null;
  if (Number(min) > Number(max)) return `${label}: minimum is greater than maximum.`;
  return null;
}

export function PropertyFiltersDialog({
  open,
  onClose,
  filters,
  onApply,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  filters: PropertyFilterState;
  onApply: (next: PropertyFilterState) => void;
  onClear: () => void;
}) {
  const [draft, setDraft] = useState<PropertyFilterState>(filters);

  useEffect(() => {
    if (open) setDraft(filters);
    // Only seed the draft when the dialog opens; live parent renders should
    // not discard the user's in-progress filter edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function set<K extends keyof PropertyFilterState>(key: K, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  const priceError = rangeError(draft.minPrice, draft.maxPrice, "Price range");
  const areaError = rangeError(draft.minArea, draft.maxArea, "Area range");
  const validationError = priceError ?? areaError;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Filter properties"
      description="Filters combine with the search field. Price ranges use the normalised PKR value."
      size="lg"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              setDraft(EMPTY_PROPERTY_FILTERS);
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
        <Field label="Purpose" htmlFor="filter-purpose">
          <Select
            id="filter-purpose"
            value={draft.purpose}
            onChange={(event) => set("purpose", event.target.value)}
          >
            <option value="">Any purpose</option>
            {PROPERTY_PURPOSES.map((purpose) => (
              <option key={purpose} value={purpose}>
                {purpose === "Rent" ? "For rent" : "For sale"}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Property type" htmlFor="filter-type">
          <Select
            id="filter-type"
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

        <Field label="Status" htmlFor="filter-status">
          <Select
            id="filter-status"
            value={draft.status}
            onChange={(event) => set("status", event.target.value)}
          >
            <option value="">Any status</option>
            {PROPERTY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Bedrooms" htmlFor="filter-bedrooms">
          <Select
            id="filter-bedrooms"
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

        <Field label="Location contains" htmlFor="filter-location" className="sm:col-span-2">
          <Input
            id="filter-location"
            value={draft.location}
            onChange={(event) => set("location", event.target.value)}
            placeholder="e.g. DHA Phase 5"
          />
        </Field>

        <Field
          label="Minimum price (PKR)"
          htmlFor="filter-min-price"
          hint="Uses the normalized total or monthly amount."
        >
          <Input
            id="filter-min-price"
            type="number"
            inputMode="numeric"
            min={0}
            value={draft.minPrice}
            onChange={(event) => set("minPrice", event.target.value)}
            placeholder="0"
          />
        </Field>

        <Field label="Maximum price (PKR)" htmlFor="filter-max-price">
          <Input
            id="filter-max-price"
            type="number"
            inputMode="numeric"
            min={0}
            value={draft.maxPrice}
            onChange={(event) => set("maxPrice", event.target.value)}
            placeholder="No maximum"
          />
        </Field>

        <Field label="Area unit" htmlFor="filter-area-unit" className="sm:col-span-2">
          <Select
            id="filter-area-unit"
            value={draft.areaUnit}
            onChange={(event) => set("areaUnit", event.target.value)}
          >
            <option value="">Any area unit</option>
            {AREA_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {AREA_UNIT_LABELS[unit]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Minimum area" htmlFor="filter-min-area">
          <Input
            id="filter-min-area"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={draft.minArea}
            onChange={(event) => set("minArea", event.target.value)}
            placeholder="0"
            disabled={!draft.areaUnit}
          />
        </Field>

        <Field label="Maximum area" htmlFor="filter-max-area">
          <Input
            id="filter-max-area"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={draft.maxArea}
            onChange={(event) => set("maxArea", event.target.value)}
            placeholder="No maximum"
            disabled={!draft.areaUnit}
          />
        </Field>

        <p className="text-[11px] leading-5 text-muted sm:col-span-2">
          Area ranges compare records stored in the selected unit. EstateFlow
          does not silently convert Marla, Kanal, square feet, square yards or
          acres.
        </p>

        {validationError ? (
          <p role="alert" className="text-xs leading-5 text-danger sm:col-span-2">
            {validationError}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
