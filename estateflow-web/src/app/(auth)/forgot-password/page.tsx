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
      <div>
        <EstateFlowBrandHeader height={36} className="mb-7" />
        <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-soft text-accent">
          <MailCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <h1 className="mt-4 font-display text-[34px] leading-[1.08] tracking-[-0.015em] text-ink">
          Check your inbox
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          If an EstateFlow account exists for <strong className="text-ink">{sentTo}</strong>,
          Firebase has sent a password reset link. The link expires according to
          your Firebase Authentication settings.
        </p>
        <p className="mt-2 text-[12px] leading-5 text-muted">
          Nothing arrived? Check spam, then try again or contact the person who
          manages your Firebase project.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button variant="secondary" className="w-full" onClick={() => setSentTo(null)}>
            Try another email
          </Button>
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center gap-2 text-[13px] font-medium text-accent underline-offset-4 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <EstateFlowBrandHeader height={36} className="mb-7" />
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
        Password reset
      </p>
      <h1 className="mt-2 font-display text-[34px] leading-[1.08] tracking-[-0.015em] text-ink">
        Reset your password
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        Enter the email address on your EstateFlow account. We&apos;ll ask
        Firebase Authentication to send a reset link.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-7 space-y-4">
        <Field label="Email address" htmlFor="reset-email" error={errors.email?.message} required>
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
          <InlineNotice tone="danger" title="Could not send the reset email">
            {error}
          </InlineNotice>
        ) : null}

        <Button type="submit" className="w-full" size="lg" loading={submitting}>
          {submitting ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <Link
        href="/login"
        className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-accent underline-offset-4 hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to sign in
      </Link>
    </div>
  );
}
