import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What EstateFlow stores, where it lives, who can see it, and how to remove it.",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
      <div className="mt-2 space-y-2 text-[13.5px] leading-6 text-ink-2">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <article>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
        Legal
      </p>
      <h1 className="mt-2 font-display text-[38px] leading-[1.05] tracking-[-0.015em] text-ink sm:text-[46px]">
        Privacy Policy
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        Last updated 25 October 2026. This page describes what the EstateFlow web
        app actually does with data. It is a plain-language description, not legal
        advice, and should be reviewed by counsel before commercial launch.
      </p>

      <div className="mt-8 space-y-8 rounded-card border border-border bg-surface px-5 py-6 sm:px-8 sm:py-8">
        <Section title="What EstateFlow is">
          <p>
            EstateFlow is a property and client workspace for real-estate work. The
            web app at this domain and the EstateFlow Android app read and write the
            same Firebase project. This policy covers both surfaces where they share
            data.
          </p>
        </Section>

        <Section title="Data the app stores">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong className="font-medium text-ink">Account data.</strong> Email
              address, display name, user id and sign-in provider, handled by Firebase
              Authentication. Passwords are never stored by EstateFlow; password
              verification is performed by Firebase.
            </li>
            <li>
              <strong className="font-medium text-ink">Workspace records.</strong>{" "}
              Property listings and client records you enter, including names, phone
              numbers, locations, prices, requirements and follow-up status.
            </li>
            <li>
              <strong className="font-medium text-ink">Media.</strong> Images you
              upload or generate are stored as objects in Cloud Storage. Firestore
              stores a record with the object path, type, size, linked property and
              creation date.
            </li>
            <li>
              <strong className="font-medium text-ink">Social drafts.</strong> Captions,
              hashtags, selected destinations and scheduling fields you save. No social
              account is connected in this build, so no social access tokens are stored.
            </li>
            <li>
              <strong className="font-medium text-ink">Preferences.</strong> Theme and
              accent choice are stored in this browser's local storage and, when
              Firestore is available, in your user profile.
            </li>
          </ul>
          <p>
            The app does not request payment details and configures no third-party
            analytics or advertising SDKs.
          </p>
        </Section>

        <Section title="Where the data lives">
          <p>
            Data is stored in Google Firebase (Cloud Firestore and Cloud Storage) for
            the EstateFlow project. Google processes it under its own terms and
            security commitments. Data may be processed outside Pakistan. Your browser
            also keeps an authentication session and theme preference locally.
          </p>
        </Section>

        <Section title="Who can see it">
          <p>
            Access is limited to authenticated accounts in the EstateFlow Firebase
            project. The currently deployed rules allow any signed-in member of that
            project to read and write the shared{" "}
            <code className="rounded bg-surface-2 px-1 py-0.5 text-[12px]">properties</code>{" "}
            and{" "}
            <code className="rounded bg-surface-2 px-1 py-0.5 text-[12px]">clients</code>{" "}
            collections. Profile, media and social drafts are scoped to the signed-in
            user's own record. The project README documents stricter owner-scoped
            rules and the backfill required before enabling them, because legacy
            records do not carry an owner id.
          </p>
          <p>
            EstateFlow does not sell data, and does not share it with advertisers. Data
            leaves Firebase only when a feature you invoke needs an external provider —
            for example, AI image generation if a provider key is configured.
          </p>
        </Section>

        <Section title="AI image generation">
          <p>
            The AI Image Studio is not connected to a provider in this deployment. If
            it is configured later, the prompt you type and the property details you
            choose to include would be sent to that provider to produce an image. The
            result is stored in your media library and labelled as a concept. Do not
            enter sensitive information into a prompt.
          </p>
        </Section>

        <Section title="Social publishing">
          <p>
            The Social Media Hub can save drafts but cannot publish. No platform
            connection or token exists in this build. If publishing is added later,
            tokens must be held server-side and never in this browser. Drafts remain
            in your own user record until you delete them.
          </p>
        </Section>

        <Section title="Cookies and local storage">
          <p>
            EstateFlow does not use advertising or tracking cookies. Firebase
            Authentication uses browser storage to keep you signed in, and the theme
            preference is stored in local storage. Clearing site data signs you out.
          </p>
        </Section>

        <Section title="Deleting data">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Deleting a property or client removes the Firestore document for every signed-in client.</li>
            <li>Deleting an image removes the Storage object and its Firestore metadata record.</li>
            <li>Deleting a social draft removes the Firestore document.</li>
            <li>
              Account deletion is not self-service in this build. The Firebase project
              owner can remove an account and its{" "}
              <code className="rounded bg-surface-2 px-1 py-0.5 text-[12px]">users/&#123;uid&#125;</code>{" "}
              data on request.
            </li>
          </ul>
          <p>There is no automatic retention schedule beyond these actions.</p>
        </Section>

        <Section title="Children">
          <p>
            EstateFlow is a business tool and is not directed at children. Do not
            create accounts for, or enter records about, children.
          </p>
        </Section>

        <Section title="Changes and contact">
          <p>
            This page will be updated when the app's data handling changes; the date at
            the top reflects the latest revision. Questions and deletion requests should
            go to the Firebase project owner shown in the EstateFlow Firebase console.
          </p>
        </Section>
      </div>
    </article>
  );
}
