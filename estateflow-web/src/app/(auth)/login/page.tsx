"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { describeAuthError } from "@/lib/errors";
import { supabase } from "@/lib/auth";
import { loginSchema, type LoginValues } from "@/lib/validation";
import { Button, Field, InlineNotice, Input, Spinner } from "@/components/ui";
import { GoogleButton } from "@/components/auth/google-button";
import { Divider, PasswordField } from "@/components/auth/password-field";
import { EstateFlowBrandHeader } from "@/components/brand/estateflow-logo";
import { safeNext } from "@/lib/navigation";
import { useDocumentTitle } from "@/lib/use-document-title";

function LoginForm() {
  useDocumentTitle("Sign in");
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const { user, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, next, router]);

  async function onSubmit(values: LoginValues) {
    setSubmitting(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email.trim(),
        password: values.password,
      });
      if (error) throw error;
      router.replace(next);
    } catch (submitError) {
      setError(describeAuthError(submitError));
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center" aria-busy="true">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <EstateFlowBrandHeader height={38} className="mb-7" />
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
        Sign in
      </p>
      <h1 className="mt-2 font-display text-[36px] leading-[1.08] tracking-[-0.015em] text-ink">
        Welcome back
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        Use the same EstateFlow account as the mobile app. Your listings and
        clients are already here.
      </p>

      <div className="mt-7">
        <GoogleButton
          label="Continue with Google"
          next={next}
          onError={setError}
        />
      </div>

      <Divider label="or continue with email" />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field label="Email address" htmlFor="email" error={errors.email?.message} required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password?.message} required>
          <PasswordField
            id="password"
            autoComplete="current-password"
            placeholder="Your password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
        </Field>

        <div className="-mt-1 flex justify-end">
          <Link
            href="/forgot-password"
            className="text-[12.5px] font-medium text-accent underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {error ? (
          <InlineNotice tone="danger" title="Could not sign in">
            {error}
          </InlineNotice>
        ) : null}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={submitting}
          icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
        >
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-muted">
        New to EstateFlow?{" "}
        <Link
          href={`/signup${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-medium text-accent underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-72 items-center justify-center" aria-busy="true">
          <Spinner />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
