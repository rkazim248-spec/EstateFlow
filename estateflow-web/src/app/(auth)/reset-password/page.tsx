"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import { getFirebase } from "@/lib/firebase";
import { describeAuthError } from "@/lib/errors";
import { Button, Field, InlineNotice, Input } from "@/components/ui";
import { useDocumentTitle } from "@/lib/use-document-title";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .regex(/[A-Za-z]/, "Include at least one letter.")
      .regex(/\d/, "Include at least one number."),
    confirmPassword: z.string().min(1, "Re-enter your password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });
type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  useDocumentTitle("Reset password");
  return (
    <Suspense fallback={<div className="text-sm text-muted">Loading…</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}

function ResetPasswordInner() {
  const [email, setEmail] = useState<string | null>(null);
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onTouched",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("oobCode");
    const mode = params.get("mode");
    if (!code || mode !== "resetPassword") {
      setError("This reset link is invalid or has expired.");
      setVerifying(false);
      return;
    }
    setOobCode(code);
    const { auth } = getFirebase();
    verifyPasswordResetCode(auth, code)
      .then((verifiedEmail) => {
        setEmail(verifiedEmail);
        setVerifying(false);
      })
      .catch((err) => {
        setError(describeAuthError(err));
        setVerifying(false);
      });
  }, []);

  async function onSubmit(values: ResetPasswordValues) {
    if (!oobCode) return;
    setSubmitting(true);
    setError(null);
    try {
      const { auth } = getFirebase();
      await confirmPasswordReset(auth, oobCode, values.password);
      setDone(true);
    } catch (submitError) {
      setError(describeAuthError(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  if (verifying) {
    return <div className="text-sm text-muted">Verifying reset link…</div>;
  }

  if (done) {
    return (
      <div className="space-y-4">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-accent-soft text-accent">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <h1 className="font-display text-[30px] leading-[1.08] tracking-[-0.015em] text-ink">
          Password updated
        </h1>
        <p className="text-sm leading-6 text-muted">
          Your password has been reset. You can now sign in with your new
          password.
        </p>
        <Link
          href="/login"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-field bg-accent px-4 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-hover"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
        Password reset
      </p>
      <h1 className="font-display text-[30px] leading-[1.08] tracking-[-0.015em] text-ink">
        Choose a new password
      </h1>
      {email ? (
        <p className="text-sm leading-6 text-muted">
          Resetting password for <strong className="text-ink">{email}</strong>
        </p>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 space-y-4">
        <Field label="New password" htmlFor="new-password" error={errors.password?.message} required>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "new-password-error" : undefined}
            {...register("password")}
          />
        </Field>

        <Field label="Confirm password" htmlFor="confirm-password" error={errors.confirmPassword?.message} required>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
            {...register("confirmPassword")}
          />
        </Field>

        {error ? (
          <InlineNotice tone="danger" title="Could not reset password">
            {error}
          </InlineNotice>
        ) : null}

        <Button type="submit" className="w-full" size="lg" loading={submitting}>
          {submitting ? "Updating…" : "Update password"}
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