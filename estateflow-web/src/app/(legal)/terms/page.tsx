import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "The practical terms for using EstateFlow: accounts, acceptable use, data accuracy and feature limits.",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
      <div className="mt-2 space-y-2 text-[13.5px] leading-6 text-ink-2">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <article>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
        Legal
      </p>
      <h1 className="mt-2 font-display text-[38px] leading-[1.05] tracking-[-0.015em] text-ink sm:text-[46px]">
        Terms of Use
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        Last updated 25 October 2026. These terms describe how EstateFlow is meant to
        be used. They are a plain-language baseline, not legal advice, and should be
        reviewed by counsel before commercial launch.
      </p>

      <div className="mt-8 space-y-8 rounded-card border border-border bg-surface px-5 py-6 sm:px-8 sm:py-8">
        <Section title="Using EstateFlow">
          <p>
            EstateFlow is a workspace for managing property listings, client
            requirements and the comparison between them. By signing in you agree to
            use it lawfully and only for records you are entitled to manage.
          </p>
          <p>
            Access is provided to accounts in the EstateFlow Firebase project. The
            project owner may suspend access, change features or close the workspace.
          </p>
        </Section>

        <Section title="Your account">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Keep your sign-in credentials private and use a real email address you control.</li>
            <li>You are responsible for activity performed through your account.</li>
            <li>Do not share a single account between people; create separate accounts instead.</li>
            <li>Tell the project owner promptly if you believe your account is compromised.</li>
          </ul>
        </Section>

        <Section title="Acceptable use">
          <p>Do not use EstateFlow to:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>store or publish unlawful, fraudulent, harassing or discriminatory material;</li>
            <li>upload malware, attempt to bypass security rules, or access another person's data without permission;</li>
            <li>scrape, overload or interfere with the service or its Firebase backend;</li>
            <li>misrepresent a listing, a client's intent, or a completed transaction.</li>
          </ul>
        </Section>

        <Section title="Listings, prices and matches are aids">
          <p>
            EstateFlow stores what its users enter. It does not verify ownership,
            availability, prices, phone numbers or client intent. Prices are converted
            to PKR for comparison only; the stored amount and unit remain authoritative.
          </p>
          <p>
            Match labels such as “Strong Match” or “Possible Match” compare recorded
            criteria. They are not appraisals, recommendations, guarantees or a claim
            that a deal happened. Always confirm details directly with the parties
            involved. EstateFlow is not a party to any transaction and does not provide
            brokerage, legal, tax or valuation advice.
          </p>
        </Section>

        <Section title="Generated images">
          <p>
            AI-generated images, when the feature is configured, are conceptual
            illustrations. They are not photographs of a real property and may contain
            inaccuracies. Do not present them as a factual depiction of a listing
            without clearly disclosing that they are concepts.
          </p>
        </Section>

        <Section title="Social publishing">
          <p>
            Saving a draft does not publish it. This build has no connected social
            accounts, publishing worker or scheduler, so nothing is sent to any
            platform. If publishing is enabled later, you remain responsible for the
            content, the destinations, and compliance with each platform's rules.
          </p>
        </Section>

        <Section title="Third-party services">
          <p>
            EstateFlow relies on Firebase Authentication, Cloud Firestore, Cloud Storage
            and, optionally, Google sign-in. Your use of those services is also subject
            to Google's terms. Outages or policy changes on those services can affect
            EstateFlow.
          </p>
        </Section>

        <Section title="Availability and changes">
          <p>
            The service is provided as available. Features that depend on missing
            credentials — AI generation, social connections and background publishing —
            are intentionally disabled rather than simulated. The interface states when
            a capability is not configured.
          </p>
        </Section>

        <Section title="Liability">
          <p>
            To the extent permitted by applicable law, EstateFlow is provided without
            warranties, and the project owner is not liable for indirect or
            consequential loss arising from use of the app, from records entered by
            users, or from decisions made on the basis of match labels. Nothing here
            limits liability that cannot lawfully be limited.
          </p>
        </Section>

        <Section title="Ending use">
          <p>
            You may stop using the service at any time and delete the records you
            created. The project owner may remove accounts that breach these terms or
            that are no longer authorised to access the workspace.
          </p>
        </Section>

        <Section title="Changes and contact">
          <p>
            These terms may be updated as the app changes; the date at the top reflects
            the latest revision. Questions should go to the Firebase project owner shown
            in the EstateFlow Firebase console.
          </p>
        </Section>
      </div>
    </article>
  );
}
