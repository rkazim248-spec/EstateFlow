# EstateFlow Web

The Next.js web client for the shared EstateFlow Firebase workspace. It uses the
same `properties` and `clients` collections as the Flutter app, so records created
on one client appear on the other.

## What is implemented

- Email/password and Google sign-in, password reset, and protected app routes.
- Responsive app shell with desktop sidebar, tablet rail, mobile header, mobile
  bottom navigation, and a mobile drawer. Matching was removed from the web
  app (it remains on mobile).
- Dashboard, properties, clients, and property/client detail and edit forms.
- Settings with profile sync, light/dark/system theme, six persisted accent
  palettes, privacy/terms links, and sign-out.
- Media Library metadata and private Firebase Storage upload/delete flow
  (Storage initialization is still pending).
- AI Image Studio with a server-side Gemini route.
- Social Media Hub with local previews and Firestore-backed drafts only.
- Branded auth screens, favicons, Apple icon, PWA manifest, Open Graph and
  Twitter images, and route-aware browser titles.
- Light and dark brand assets; no CSS filters are used to recolor the official
  logo.

## Requirements

- Node.js 20 or newer
- npm
- A Firebase project with a Web app registered
- Firebase Authentication and Cloud Firestore enabled

## Quick start

```powershell
cd estateflow-web
npm install
Copy-Item .env.example .env.local
```

Fill in `.env.local` from **Firebase console → Project settings → Your apps →
Web app**. Then run:

```powershell
npm run dev
```

Open <http://localhost:3000>.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | Firebase Web API key. Safe in the browser. |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | Firebase Auth domain. |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | `estateflow-df9e9` for this workspace. |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | Storage bucket for media. |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase sender ID. |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes | Firebase Web app ID. |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Public origin used by metadata and Open Graph. Use the production URL when deployed. |
| `NEXT_PUBLIC_ENABLE_DEVICE_PREVIEW` | No | Enables the device preview switcher in production. It is always available in development. |
| `GEMINI_API_KEY` | No | Server-only Google AI Studio key for AI Image Studio. Never prefix with `NEXT_PUBLIC_`. |
| `GEMINI_IMAGE_MODEL` | No | Server-side Gemini image model. Defaults to `gemini-2.5-flash-image`. |
| `SOCIAL_TOKEN_ENCRYPTION_KEY` | No | Reserved for a future server-side social publishing worker. It is not used by the current web app. |

`.env.example` contains no secrets. `.env.local` is ignored by git.

## Firebase setup

The checked-in configuration targets Firebase project `estateflow-df9e9`.

1. Enable **Email/Password** and **Google** under Authentication → Sign-in method.
2. Add `localhost` and the production hostname under Authentication → Settings →
   Authorized domains.
3. Confirm the Firestore database is `(default)` in `nam5`.
4. Initialize **Firebase Storage** in the console before testing media uploads.
   This repository's Storage rules are ready, but the project's default Storage
   bucket has not been created yet.
5. Deploy the Firestore rules:

   ```powershell
   npx firebase-tools deploy --only firestore:rules --project estateflow-df9e9
   ```

6. After Storage is initialized, deploy Storage rules:

   ```powershell
   npx firebase-tools deploy --only storage --project estateflow-df9e9
   ```

The current `firestore.rules` is the shared-workspace policy: any signed-in user
can read and write `properties` and `clients`, while each user's profile, media
metadata, social drafts, and social accounts remain owner-scoped. The stricter
owner-scoped policy is in `../firestore.owner-scoped.rules`. Do not deploy it
until every legacy property/client document has an `ownerId`; records without one
become invisible. Use a trusted Admin SDK script for that backfill.

## Data model

| Path | Access | Notes |
| --- | --- | --- |
| `properties/{id}` | Signed-in workspace members | Shared with the Flutter app. Legacy records may lack `ownerId` and timestamps. |
| `clients/{id}` | Signed-in workspace members | Shared with the Flutter app. |
| `users/{uid}` | Owner only | Profile, display name, email, appearance preferences. |
| `users/{uid}/media/{id}` | Owner only | Firestore metadata only; binaries live in Storage. |
| `users/{uid}/socialPosts/{id}` | Owner only | Drafts and previews. No publisher reads these in the current app. |
| `users/{uid}/socialAccounts/{id}` | Owner read only | Reserved for server-written account metadata. Clients cannot write tokens. |
| `users/{uid}/socialPosts/{id}/results/{id}` | Owner read only | Reserved for server-written publication results. |

Media binaries are stored under `users/{uid}/media/...` in Firebase Storage and
are private by default. Uploads are limited to image content and 10 MB.

## Branding

The brand source of truth is the supplied EstateFlow brand reference, not the
presentation mockup around it. The symbol, wordmark, and tagline were traced into
clean SVG paths. Official colors:

- Blue: `#0866F5`
- Navy: `#101D3A`
- Neutral background: `#F7F9FC`
- Tagline: **Find • Manage • Grow**

Assets:

| Location | Contents |
| --- | --- |
| `public/brand/` | Full/compact lockups, light/dark variants, symbol, tagline, app icon, maskable icon, Open Graph source |
| `public/icons/` | PWA 192/512 icons, maskable icons, 32px favicon |
| `src/app/` | `icon.svg`, `favicon.ico`, `apple-icon.png`, `opengraph-image.png`, `twitter-image.png`, manifest |
| `src/components/brand/` | `EstateFlowLogo`, `EstateFlowSymbol`, `EstateFlowAppIcon`, `EstateFlowBrandHeader` |

Branding is wired into the auth layout and auth screens, desktop/tablet sidebar,
mobile header, mobile drawer, preview toolbar, legal pages, loading state,
metadata, manifest, favicon, Apple icon, Open Graph, and Twitter cards. The
light/dark assets are separate files; CSS filters are not used.

## AI Image Studio

The studio calls `POST /api/ai/generate` and requires `GEMINI_API_KEY` on the
server. Without a key the UI explicitly reports that generation is unavailable
and does not show sample output. With a key, the server calls the configured
Gemini image model, returns generated image bytes, and lets the user save the
result to the private Media Library.

Current status: **not configured** — no Gemini key is present in this workspace.
Provider quota and billing belong to the key owner. The per-instance rate limit
in the route is best effort; a production deployment should use a shared limiter.

## Social Media Hub

The hub composes captions, hashtags, media references, destinations, and planned
times. It stores **drafts only** under `users/{uid}/socialPosts`. Previews are
built locally. Nothing is sent to Facebook, Instagram, LinkedIn, Pinterest,
TikTok, or X.

There is no OAuth callback, token exchange, encrypted token store, publisher
worker, or scheduler in this repository. Connecting and publishing would require:

- approved platform developer apps and redirect URIs;
- a server-only OAuth flow and encrypted token storage;
- a background publisher using the Firebase Admin SDK;
- Cloud Scheduler or an equivalent worker;
- platform-specific media and caption validation.

The current `socialAccounts` and `results` rules are read-only for clients so a
future server can own tokens and publication results.

## Scripts

```powershell
npm run dev        # development server
npm run typecheck  # TypeScript, no emit
npm run build      # production build
npm run start      # serve the production build
```

Validation used for this implementation:

```powershell
npx tsc --noEmit
npm run build
```

The shell and key screens were also checked manually in Chrome at 1440, 768, and
390px. All workspace routes were opened at 1440px. The dashboard was checked at
390px in light and dark; settings, AI Studio, Social Hub, and the mobile drawer
were checked at 390px in dark mode. The temporary QA account, profile, and social
draft were deleted after the checks.

## Deployment

The app needs a Node.js host because `/api/ai/generate` is a server route. Vercel
is the simplest fit. Set the variables from `.env.example` in the host's
environment, set `NEXT_PUBLIC_SITE_URL` to the public origin, and add the
production hostname to Firebase Authentication → Authorized domains.

There is no Firebase Hosting configuration in this repository. Do not use
`next export`; the AI route requires a server runtime.

## Known limitations

- Firebase Storage is not initialized for `estateflow-df9e9` yet. Media uploads
  will not work until it is enabled in the Firebase console.
- AI generation has no configured provider key.
- Social publishing is not configured and is intentionally draft-only.
- The shared `properties`/`clients` rules are workspace-wide, not per-owner.
  Legacy records have no `ownerId`.
- There is no automated web test suite; TypeScript, production build, and manual
  browser checks are the current validation.
- Matching was removed from the web app; it remains available on mobile.
- The mobile app now includes AI Image Studio, Media Library, and Social Media
  Hub screens. Mobile AI generation requires a deployed EstateFlow web API URL.
