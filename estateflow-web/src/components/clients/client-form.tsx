"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Save } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { createClient, updateClient } from "@/lib/data";
import { describeDataError } from "@/lib/errors";
import { formatPkr, toPkr } from "@/lib/money";
import {
  BEDROOM_OPTIONS,
  CLIENT_PURPOSES,
  CLIENT_STATUSES,
  PROPERTY_TYPES,
  budgetUnitsForPurpose,
  typeUsesBedrooms,
  type PriceUnit,
} from "@/lib/constants";
import { clientFormSchema, type ClientFormValues } from "@/lib/validation";
import type { ClientRecord } from "@/lib/types";
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

function defaultsFor(client?: ClientRecord): ClientFormValues {
  return {
    name: client?.name ?? "",
    phone: client?.phone ?? "",
    purpose: client?.purpose ?? "Want to Buy",
    type: client?.type ?? "House",
    bedrooms: client?.bedrooms ?? "",
    customBedrooms: client?.customBedrooms ?? "",
    budget: client ? String(client.budget) : "",
    budgetUnit: client?.budgetUnit ?? "Lakh",
    location: client?.location ?? "",
    requirements: client?.requirements ?? "",
    condition: client?.condition ?? "",
    status: client?.status ?? "New",
  };
}

export function ClientForm({
  mode,
  client,
}: {
  mode: "create" | "edit";
  client?: ClientRecord;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);
  const savedRef = useRef(false);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: defaultsFor(client),
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
  const budget = watch("budget");
  const budgetUnit = watch("budgetUnit");

  const units = budgetUnitsForPurpose(purpose);
  const usesBedrooms = typeUsesBedrooms(type);
  const isRent = purpose === "Want to Rent";

  useEffect(() => {
    if (!units.includes(budgetUnit as PriceUnit)) {
      setValue("budgetUnit", units[0], { shouldValidate: true, shouldDirty: true });
    }
  }, [purpose, budgetUnit, units, setValue]);

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
    const value = Number(budget);
    if (!Number.isFinite(value) || value <= 0) return null;
    return toPkr(value, budgetUnit);
  }, [budget, budgetUnit]);

  async function onSubmit(values: ClientFormValues) {
    if (!user) return;
    setSubmitError(null);
    try {
      if (mode === "edit" && client) {
        await updateClient(client.id, values, user.uid);
        savedRef.current = true;
        toast({
          variant: "success",
          title: "Client updated",
          description: `${values.name.trim()} was saved to Firestore.`,
        });
        router.push(`/clients/${client.id}`);
      } else {
        const id = await createClient(values, user.uid);
        savedRef.current = true;
        toast({
          variant: "success",
          title: "Client added",
          description: `${values.name.trim()} is now in your workspace.`,
        });
        router.push(`/clients/${id}`);
      }
    } catch (error) {
      setSubmitError(describeDataError(error));
    }
  }

  function handleCancel() {
    if (isDirty && !savedRef.current) setDiscardOpen(true);
    else router.push("/clients");
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Card className="p-4 sm:p-5">
          <SectionHeading
            title="Client"
            description="Identity and the intent recorded at enquiry time."
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Client name"
              htmlFor="client-name"
              error={errors.name?.message}
              required
            >
              <Input
                id="client-name"
                placeholder="e.g. Ayesha Khan"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "client-name-error" : undefined}
                {...register("name")}
              />
            </Field>

            <Field
              label="Phone number"
              htmlFor="client-phone"
              error={errors.phone?.message}
              hint="Pakistani or international format, e.g. +92 300 1234567."
              required
            >
              <Input
                id="client-phone"
                type="tel"
                inputMode="tel"
                placeholder="+92 300 1234567"
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "client-phone-error" : undefined}
                {...register("phone")}
              />
            </Field>

            <Field
              label="Purpose"
              htmlFor="client-purpose"
              error={errors.purpose?.message}
              required
            >
              <Select
                id="client-purpose"
                aria-invalid={Boolean(errors.purpose)}
                {...register("purpose")}
              >
                {CLIENT_PURPOSES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Preferred property type"
              htmlFor="client-type"
              error={errors.type?.message}
              required
            >
              <Select
                id="client-type"
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
              htmlFor="client-status"
              error={errors.status?.message}
              required
            >
              <Select
                id="client-status"
                aria-invalid={Boolean(errors.status)}
                {...register("status")}
              >
                {CLIENT_STATUSES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Field>

            {usesBedrooms ? (
              <Field
                label="Bedroom preference"
                htmlFor="client-bedrooms"
                error={errors.bedrooms?.message}
                required
              >
                <Select
                  id="client-bedrooms"
                  aria-invalid={Boolean(errors.bedrooms)}
                  {...register("bedrooms")}
                >
                  <option value="">Select a preference</option>
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
                label="Custom bedroom requirement"
                htmlFor="client-custom-bedrooms"
                error={errors.customBedrooms?.message}
                hint="Describe what the client actually needs."
                required
                className="sm:col-span-2"
              >
                <Input
                  id="client-custom-bedrooms"
                  placeholder="e.g. 4 bedrooms plus a servant quarter"
                  aria-invalid={Boolean(errors.customBedrooms)}
                  aria-describedby={
                    errors.customBedrooms ? "client-custom-bedrooms-error" : undefined
                  }
                  {...register("customBedrooms")}
                />
              </Field>
            ) : null}
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionHeading
            title="Budget and area"
            description={
              isRent
                ? "Monthly rent budget. Units follow the selected purpose."
                : "Purchase budget. Units follow the selected purpose."
            }
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Budget"
              htmlFor="client-budget"
              error={errors.budget?.message}
              required
            >
              <Input
                id="client-budget"
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                placeholder="e.g. 1.5"
                aria-invalid={Boolean(errors.budget)}
                aria-describedby={errors.budget ? "client-budget-error" : undefined}
                {...register("budget")}
              />
            </Field>
            <Field
              label="Budget unit"
              htmlFor="client-budget-unit"
              error={errors.budgetUnit?.message}
              required
            >
              <Select
                id="client-budget-unit"
                aria-invalid={Boolean(errors.budgetUnit)}
                {...register("budgetUnit")}
              >
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="sm:col-span-2 rounded-field border border-border bg-surface-2 px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                Normalised PKR
              </p>
              <p className="mt-0.5 text-[13px] font-medium text-ink tnum">
                {normalizedPreview
                  ? `≈ ${formatPkr(normalizedPreview)}${isRent ? " per month" : " total"}`
                  : "Enter a budget to see the normalised value."}
              </p>
              <p className="mt-1 text-[11px] leading-4 text-muted">
                Matching compares this value with the property&apos;s normalised
                price when the budget unit and purpose are compatible.
              </p>
            </div>

            <Field
              label="Preferred location"
              htmlFor="client-location"
              error={errors.location?.message}
              required
              className="sm:col-span-2"
            >
              <Input
                id="client-location"
                placeholder="e.g. Bahria Town, Lahore"
                aria-invalid={Boolean(errors.location)}
                aria-describedby={errors.location ? "client-location-error" : undefined}
                {...register("location")}
              />
            </Field>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <SectionHeading
            title="Requirements and conditions"
            description="Free text, kept for context. Matching only uses it where a comparison is reliable."
          />
          <div className="mt-4 grid gap-4">
            <Field
              label="Client requirement"
              htmlFor="client-requirements"
              error={errors.requirements?.message}
              hint="What the client is looking for."
              optional
            >
              <Textarea
                id="client-requirements"
                rows={3}
                placeholder="e.g. Ground floor, park-facing, ready to move."
                aria-invalid={Boolean(errors.requirements)}
                {...register("requirements")}
              />
            </Field>
            <Field
              label="Client condition"
              htmlFor="client-condition"
              error={errors.condition?.message}
              hint="Timing, financing, constraints or other notes."
              optional
            >
              <Textarea
                id="client-condition"
                rows={3}
                placeholder="e.g. Wants possession within three months; cash purchase."
                aria-invalid={Boolean(errors.condition)}
                {...register("condition")}
              />
            </Field>
          </div>
        </Card>

        {submitError ? (
          <InlineNotice tone="danger" title="Could not save the client">
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
              {isSubmitting ? "Saving…" : mode === "edit" ? "Save changes" : "Save client"}
            </Button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={discardOpen}
        onClose={() => setDiscardOpen(false)}
        onConfirm={() => {
          savedRef.current = true;
          router.push("/clients");
        }}
        title="Discard unsaved changes?"
        description="Your edits to this client will be lost."
        confirmLabel="Discard changes"
      />
    </>
  );
}
