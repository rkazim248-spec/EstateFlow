"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sendPasswordResetEmail } from "firebase/auth";
import { ArrowLeft, MailCheck } from "lucide-react";

import { getFirebase } from "@/lib/firebase";
import { describeAuthError } from "@/lib/errors";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/lib/validation";
import { Button, Field, InlineNotice, Input } from "@/components/ui";
import { EstateFlowBrandHeader } from "@/components/brand/estateflow-logo";
import { useDocumentTitle } from "@/lib/use-document-title";

export default function ForgotPasswordPage() {
  useDocumentTitle("Reset password");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onTouched",
  });

  async function onSubmit(values: ForgotPasswordValues) {
    setSubmitting(true);
    setError(null);
    try {
      const { auth } = getFirebase();
      await sendPasswordResetEmail(auth, values.email.trim());
      setSentTo(values.email.trim());
    } catch (submitError) {
      setError(describeAuthError(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  if (sentTo) {
    return (
      <div className="space-y-4">
        <EstateFlowBrandHeader height={32} className="mb-4" />
        <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent">
          <MailCheck className="h-4 w-4" aria-hidden="true" />
        </span>
        <h1 className="font-display text-[24px] leading-[1.08] tracking-[-0.015em] text-ink">
          Check your inbox
        </h1>
        <p className="text-sm leading-6 text-muted">
          If an account exists for <strong className="text-ink">{sentTo}</strong>,
          a reset link has been sent.
        </p>
        <div className="flex flex-col gap-2">
          <Button variant="secondary" className="w-full" onClick={() => setSentTo(null)}>
            Try another email
          </Button>
          <Link
            href="/login"
            className="inline-flex h-9 items-center justify-center gap-2 text-[13px] font-medium text-accent underline-offset-4 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <EstateFlowBrandHeader height={32} className="mb-4" />
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
        Password reset
      </p>
      <h1 className="font-display text-[24px] leading-[1.08] tracking-[-0.015em] text-ink">
        Reset your password
      </h1>
      <p className="text-sm leading-6 text-muted">
        Enter your email to receive a reset link.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
        <Field label="Email" htmlFor="reset-email" error={errors.email?.message} required>
          <Input
            id="reset-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "reset-email-error" : undefined}
            {...register("email")}
          />
        </Field>

        {error ? (
          <InlineNotice tone="danger" title="Could not send">
            {error}
          </InlineNotice>
        ) : null}

        <Button type="submit" className="w-full" size="lg" loading={submitting}>
          {submitting ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-accent underline-offset-4 hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to sign in
      </Link>
    </div>
  );
}