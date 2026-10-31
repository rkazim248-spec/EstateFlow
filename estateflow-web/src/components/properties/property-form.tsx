"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Save } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { createProperty, updateProperty } from "@/lib/data";
import { describeDataError } from "@/lib/errors";
import { formatPkr, toPkr } from "@/lib/money";
import {
  AREA_UNITS,
  AREA_UNIT_LABELS,
  BEDROOM_OPTIONS,
  PROPERTY_PURPOSES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  priceUnitsForPurpose,
  typeUsesBedrooms,
  type PriceUnit,
} from "@/lib/constants";
import {
  propertyFormSchema,
  type PropertyFormValues,
} from "@/lib/validation";
import type { PropertyRecord } from "@/lib/types";
import {
  Button,
  Card,
  ConfirmDialog,
  Field,
  InlineNotice,
  Input,
  SectionHeading,
  Select,
  Textarea,
  useToast,
} from "@/components/ui";

function defaultsFor(property?: PropertyRecord): PropertyFormValues {
  return {
    name: property?.name ?? "",
    purpose: property?.purpose ?? "Sell",
    type: property?.type ?? "House",
    bedrooms: property?.bedrooms ?? "",
    customBedrooms: property?.customBedrooms ?? "",
    area: property ? String(property.area) : "",
    areaUnit: property?.areaUnit ?? "Marla",
    price: property ? String(property.price) : "",
    priceUnit: property?.priceUnit ?? "Lakh",
    location: property?.location ?? "",
    status: property?.status ?? "Available",
    ownerName: property?.ownerName ?? "",
    ownerPhone: property?.ownerPhone ?? "",
    ownerCondition: property?.ownerCondition ?? "",
  };
}

export function PropertyForm({
  mode,
  property,
}: {
  mode: "create" | "edit";
  property?: PropertyRecord;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const savedRef = useRef(false);

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: defaultsFor(property),
    mode: "onTouched",
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = form;

  const purpose = watch("purpose");
  const type = watch("type");
  const bedrooms = watch("bedrooms");
  const price = watch("price");
  const priceUnit = watch("priceUnit");

  const units = priceUnitsForPurpose(purpose);
  const usesBedrooms = typeUsesBedrooms(type);

  // Never leave a sale unit selected after switching to rental, or vice versa.
  useEffect(() => {
    if (!units.includes(priceUnit as PriceUnit)) {
      setValue("priceUnit", units[0], { shouldValidate: true, shouldDirty: true });
    }
  }, [purpose, priceUnit, units, setValue]);

  // Bedrooms are irrelevant for plots, shops and offices.
  useEffect(() => {
    if (!usesBedrooms) {
      if (bedrooms) setValue("bedrooms", "", { shouldDirty: true });
      if (watch("customBedrooms")) {
        setValue("customBedrooms", "", { shouldDirty: true });
      }
    }
  }, [usesBedrooms, bedrooms, setValue, watch]);

  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (!isDirty || savedRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [isDirty]);

  const normalizedPreview = useMemo(() => {
    const value = Number(price);
    if (!Number.isFinite(value) || value <= 0) return null;
    return toPkr(value, priceUnit);
  }, [price, priceUnit]);

  const isRent = purpose === "Rent";

  async function onSubmit(values: PropertyFormValues) {
    if (!user) return;
    setSubmitError(null);
    try {
      if (mode === "edit" && property) {
        await updateProperty(property.id, values, user.uid);
        savedRef.current = true;
        toast({
          variant: "success",
          title: "Property updated",
          description: `${values.name.trim()} was saved to Firestore.`,
        });
        router.push(`/properties/${property.id}`);
      } else {
        const id = await createProperty(values, user.uid);
        savedRef.current = true;
        toast({
          variant: "success",
          title: "Property added",
          description: `${values.name.trim()} is now in your workspace.`,
        });
        router.push(`/properties/${id}`);
      }
    } catch (error) {
      setSubmitError(describeDataError(error));
    }
  }

  function handleCancel() {
    if (isDirty && !savedRef.current) setDiscardOpen(true);
    else router.push("/properties");
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Card className="p-4 sm:p-5">
          <SectionHeading
            title="Listing"
            description="The essentials shown on property cards and in the mobile app."
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Property name"
              htmlFor="property-name"
              error={errors.name?.message}
              required
              className="sm:col-span-2"
            >
              <Input
                id="property-name"
                placeholder="e.g. DHA Phase 6 corner house"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "property-name-error" : undefined}
                {...register("name")}
              />
            </Field>

            <Field
              label="Purpose"
              htmlFor="property-purpose"
              error={errors.purpose?.message}
              required
            >
              <Select
                id="property-purpose"
                aria-invalid={Boolean(errors.purpose)}
                {...register("purpose")}
              >
                {PROPERTY_PURPOSES.map((option) => (
                  <option key={option} value={option}>
                    {option === "Rent" ? "For rent" : "For sale"}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Property type"
              htmlFor="property-type"
              error={errors.type?.message}
              required
            >
              <Select
                id="property-type"
                aria-invalid={Boolean(errors.type)}
                {...register("type")}
              >
                {PROPERTY_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Status"
              htmlFor="property-status"
              error={errors.status?.message}
              required
            >
              <Select
                id="property-status"
                aria-invalid={Boolean(errors.status)}
                {...register("status")}
              >
                {PROPERTY_STATUSES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Field>

            {usesBedrooms ? (
              <Field
                label="Bedrooms"
                htmlFor="property-bedrooms"
                error={errors.bedrooms?.message}
                required
              >
                <Select
                  id="property-bedrooms"
                  aria-invalid={Boolean(errors.bedrooms)}
                  {...register("bedrooms")}
                >
                  <option value="">Select a configuration</option>
                  {BEDROOM_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <div className="hidden sm:block" aria-hidden="true" />
            )}

            {usesBedrooms && bedrooms === "Custom" ? (
              <Field
                label="Custom bedroom configuration"
                htmlFor="property-custom-bedrooms"
                error={errors.customBedrooms?.message}
                hint="For example: 3 bedrooms plus a study, or 2 bedrooms with a separate guest wing."
                required
                className="sm:col-span-2"
              >
                <Input
                  id="property-custom-bedrooms"
                  placeholder="Describe the configuration"
                  aria-invalid={Boolean(errors.customBedrooms)}
                  aria-describedby={
                    errors.customBedrooms ? "property-custom-bedrooms-error" : undefined
                  }
                  {...register("customBedrooms")}
                />
              </Field>
            ) : null}
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionHeading
            title="Size"
            description="Stored exactly as entered. Area units are never converted silently."
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Area"
              htmlFor="property-area"
              error={errors.area?.message}
              required
            >
              <Input
                id="property-area"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                placeholder="e.g. 5"
                aria-invalid={Boolean(errors.area)}
                aria-describedby={errors.area ? "property-area-error" : undefined}
                {...register("area")}
              />
            </Field>
            <Field
              label="Area unit"
              htmlFor="property-area-unit"
              error={errors.areaUnit?.message}
              required
            >
              <Select
                id="property-area-unit"
                aria-invalid={Boolean(errors.areaUnit)}
                {...register("areaUnit")}
              >
                {AREA_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {AREA_UNIT_LABELS[unit]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionHeading
            title="Pricing"
            description={
              isRent
                ? "Monthly rent. Units follow the selected purpose."
                : "Sale price. Units follow the selected purpose."
            }
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Price"
              htmlFor="property-price"
              error={errors.price?.message}
              required
            >
              <Input
                id="property-price"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                placeholder="e.g. 85"
                aria-invalid={Boolean(errors.price)}
                aria-describedby={errors.price ? "property-price-error" : undefined}
                {...register("price")}
              />
            </Field>
            <Field
              label="Price unit"
              htmlFor="property-price-unit"
              error={errors.priceUnit?.message}
              required
            >
              <Select
                id="property-price-unit"
                aria-invalid={Boolean(errors.priceUnit)}
                {...register("priceUnit")}
              >
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="mt-4 rounded-field border border-border bg-surface-2 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
              Normalised PKR
            </p>
            <p className="mt-0.5 text-[13px] font-medium text-ink tnum">
              {normalizedPreview
                ? `≈ ${formatPkr(normalizedPreview)}${isRent ? " per month" : " total"}`
                : "Enter a price to see the normalised value."}
            </p>
            <p className="mt-1 text-[11px] leading-4 text-muted">
              1 Lakh = PKR 100,000 · 1 Crore = PKR 10,000,000 · 1 Thousand =
              PKR 1,000. Rent is stored as the monthly amount.
            </p>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionHeading
            title="Location and owner"
            description="Owner details are optional, but help you follow up."
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Location"
              htmlFor="property-location"
              error={errors.location?.message}
              required
              className="sm:col-span-2"
            >
              <Input
                id="property-location"
                placeholder="e.g. DHA Phase 6, Lahore"
                aria-invalid={Boolean(errors.location)}
                aria-describedby={errors.location ? "property-location-error" : undefined}
                {...register("location")}
              />
            </Field>

            <Field label="Owner name" htmlFor="property-owner-name" error={errors.ownerName?.message} optional>
              <Input
                id="property-owner-name"
                placeholder="Owner or contact name"
                aria-invalid={Boolean(errors.ownerName)}
                {...register("ownerName")}
              />
            </Field>

            <Field
              label="Owner phone"
              htmlFor="property-owner-phone"
              error={errors.ownerPhone?.message}
              hint="Pakistani or international format, e.g. +92 300 1234567."
              optional
            >
              <Input
                id="property-owner-phone"
                type="tel"
                inputMode="tel"
                placeholder="+92 300 1234567"
                aria-invalid={Boolean(errors.ownerPhone)}
                aria-describedby={
                  errors.ownerPhone ? "property-owner-phone-error" : undefined
                }
                {...register("ownerPhone")}
              />
            </Field>

            <Field
              label="Owner conditions"
              htmlFor="property-owner-condition"
              error={errors.ownerCondition?.message}
              hint="Payment terms, handover notes, restrictions or anything else the owner specified."
              optional
              className="sm:col-span-2"
            >
              <Textarea
                id="property-owner-condition"
                rows={3}
                placeholder="e.g. Advance payment required; vacant possession from March."
                aria-invalid={Boolean(errors.ownerCondition)}
                {...register("ownerCondition")}
              />
            </Field>
          </div>
        </Card>

        {submitError ? (
          <InlineNotice tone="danger" title="Could not save the property">
            {submitError}
          </InlineNotice>
        ) : null}

        <div className="flex flex-col-reverse gap-2 rounded-card border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-1.5 px-1 text-[11px] text-muted">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
            Unsaved changes are protected by a confirmation prompt.
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              icon={<Save className="h-4 w-4" aria-hidden="true" />}
              className="w-full sm:w-auto"
            >
              {isSubmitting
                ? "Saving…"
                : mode === "edit"
                  ? "Save changes"
                  : "Save property"}
            </Button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        onConfirm={() => {
          savedRef.current = true;
          router.push("/properties");
        }}
        title="Discard unsaved changes?"
        description="Your edits to this property will be lost."
        confirmLabel="Discard changes"
      />
    </>
  );
}
