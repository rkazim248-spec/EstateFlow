"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { ArrowRight } from "lucide-react";

import { useAuth } from "@/lib/auth";
import { getFirebase } from "@/lib/firebase";
import { describeAuthError, describeDataError } from "@/lib/errors";
import { signupSchema, type SignupValues } from "@/lib/validation";
import { updateUserProfile } from "@/lib/data";
import { Button, Field, InlineNotice, Input, Spinner } from "@/components/ui";
import { GoogleButton } from "@/components/auth/google-button";
import { Divider, PasswordField } from "@/components/auth/password-field";
import { EstateFlowBrandHeader } from "@/components/brand/estateflow-logo";
import { safeNext } from "@/lib/navigation";
import { useDocumentTitle } from "@/lib/use-document-title";

function SignupForm() {
  useDocumentTitle("Create account");
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const { user, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [profileWarning, setProfileWarning] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    mode: "onTouched",
  });

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, next, router]);

  async function onSubmit(values: SignupValues) {
    setSubmitting(true);
    setError(null);
    setProfileWarning(null);
    try {
      const { auth } = getFirebase();
      const credential = await createUserWithEmailAndPassword(
        auth,
        values.email.trim(),
        values.password,
      );
      const name = values.name.trim();

      try {
        await updateProfile(credential.user, { displayName: name });
        await updateUserProfile(credential.user.uid, { name });
      } catch (profileError) {
        setProfileWarning(describeDataError(profileError));
      }

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
        Create account
      </p>
      <h1 className="mt-2 font-display text-[36px] leading-[1.08] tracking-[-0.015em] text-ink">
        Start your workspace
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        One account for the web app and the mobile app. New accounts start empty
        — no sample listings are added.
      </p>

      <div className="mt-7">
        <GoogleButton
          label="Sign up with Google"
          next={next}
          onError={setError}
        />
      </div>

      <Divider label="or use email" />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field label="Full name" htmlFor="name" error={errors.name?.message} required>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
          />
        </Field>

        <Field label="Email address" htmlFor="signup-email" error={errors.email?.message} required>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "signup-email-error" : undefined}
            {...register("email")}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="signup-password"
          error={errors.password?.message}
          hint="At least 8 characters, with a letter and a number."
          required
        >
          <PasswordField
            id="signup-password"
            autoComplete="new-password"
            placeholder="Create a password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "signup-password-error" : undefined}
            {...register("password")}
          />
        </Field>

        <Field
          label="Confirm password"
          htmlFor="confirm-password"
          error={errors.confirmPassword?.message}
          required
        >
          <PasswordField
            id="confirm-password"
            autoComplete="new-password"
            placeholder="Repeat your password"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={
              errors.confirmPassword ? "confirm-password-error" : undefined
            }
            {...register("confirmPassword")}
          />
        </Field>

        {error ? (
          <InlineNotice tone="danger" title="Could not create the account">
            {error}
          </InlineNotice>
        ) : null}

        {profileWarning ? (
          <InlineNotice tone="warning" title="Account created, profile not saved">
            {profileWarning} You can still use the app; update your name in
            Settings later.
          </InlineNotice>
        ) : null}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={submitting}
          icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
        >
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-muted">
        Already have an account?{" "}
        <Link
          href={`/login${next !== "/dashboard" ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-medium text-accent underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-72 items-center justify-center" aria-busy="true">
          <Spinner />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
