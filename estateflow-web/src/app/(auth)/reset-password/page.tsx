"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, CheckCircle2, Lock } from "lucide-react";

import { describeAuthError } from "@/lib/errors";
import { supabase } from "@/lib/auth";
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
    // Supabase uses the token_hash from the URL
    const tokenHash = params.get("token_hash");
    if (tokenHash) {
      supabase.auth
        .verifyOtp({ token_hash: tokenHash, type: "recovery" })
        .then(({ data }) => {
          if (data.user?.email) setEmail(data.user.email);
          setVerifying(false);
        })
        .catch((err) => {
          setError(describeAuthError(err));
          setVerifying(false);
        });
    } else {
      // Fallback: try to get email from Supabase session
      const session = supabase.auth.getSession();
      session.then(({ data }) => {
        if (data.session?.user?.email) setEmail(data.session.user.email);
        setVerifying(false);
      }).catch((err) => {
        setError(describeAuthError(err));
        setVerifying(false);
      });
    }
  }, []);

  async function onSubmit(values: ResetPasswordValues) {
    if (!oobCode) return;
    setSubmitting(true);
    setError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) throw error;
      setDone(true);
    } catch (submitError) {
      setError(describeAuthError(submitError));
    } finally {
      setSubmitting(false);
    }
  }

  if (verifying) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-muted">Verifying reset link…</div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-accent-soft text-accent">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-display text-[22px] leading-[1.08] tracking-[-0.015em] text-ink">
              Password updated
            </h1>
            <p className="text-sm leading-6 text-muted">
              You can now sign in with your new password.
            </p>
          </div>
        </div>
        <Link
          href="/login"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-field bg-accent px-4 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-hover"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-surface-2 text-ink">
          <Lock className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="font-display text-[22px] leading-[1.08] tracking-[-0.015em] text-ink">
            Reset password
          </h1>
          {email ? (
            <p className="text-sm leading-6 text-muted">
              for <strong className="text-ink">{email}</strong>
            </p>
          ) : null}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3">
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
        Back to sign in
      </Link>
    </div>
  );
}