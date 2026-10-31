# EstateFlow

EstateFlow is a real-estate listing and client workspace with two clients that
share one Firebase project:

- **Flutter app** at the repository root (`com.estateflow.app`) for Android,
  iOS, and web builds. Now includes AI Image Studio, Media Library, and Social
  Media Hub screens.
- **Next.js web app** in [`estateflow-web/`](estateflow-web/) for desktop and
  responsive browser use. Matching has been removed; AI Image Studio, Media
  Library, and Social Media Hub remain on web.

Both clients read and write the same `properties` and `clients` collections, so a
listing or client created in one appears in the other.

## Current status

| Area | Status |
| --- | --- |
| Flutter auth, dashboard, properties, clients, settings, AI Studio, Media Library, Social Hub | Implemented and tested |
| Flutter branding, launcher icon, adaptive icon, splash | Implemented; APK build passes |
| Flutter web metadata, manifest, favicon, first-frame splash | Implemented; web build passes |
| Next.js web app, auth, workspace, media, AI Studio, Social Hub | Implemented; typecheck and production build pass |
| Next.js branding and metadata | Implemented; checked at 1440/768/390px |
| Firestore rules | Deployed to `estateflow-df9e9` |
| Firebase Storage | **Not initialized**; media upload is not usable until enabled |
| AI image generation | **Not configured**; no Gemini key is present |
| Social publishing | **Not configured**; drafts and local previews only |
| Android AI Image Studio, Media Library, Social Media Hub | Implemented in Flutter; AI requires server URL |
| Android launcher/splash runtime check | **Not verified** on a device or emulator; resource/APK build passes |

## Features

### Flutter app

- Email/password and Google sign-in with persisted sessions.
- Dashboard with live property and client counts.
- Searchable/filterable properties and clients, detail screens, forms, delete
  actions, and property–client matching.
- Property/client matching on type, purpose, bedroom count, and budget, with
  money normalised to PKR across Lakh, Crore, Thousand, and unit variants.
- Light/dark/system theme and six accent colours, persisted on the device.
- Settings, privacy/terms links, and sign-out.
- Offline-readable Firestore data with local persistence.
- Branded auth header, dashboard app bar, settings About card, Android launcher
  icon, Android splash, and Flutter web shell.

### Next.js web app

- Email/password and Google sign-in, password reset, and protected routes.
- Desktop sidebar, tablet rail, mobile header, bottom navigation, and drawer.
- Dashboard, properties, clients, detail/edit forms, matching, settings, legal
  pages, media library, AI Image Studio, and Social Media Hub.
- Profile sync, light/dark/system theme, six persisted accents, and accessible
  responsive layouts.
- Media metadata in Firestore with a private Firebase Storage upload path
  (Storage initialization is still pending).
- Server-side Gemini image route with honest unconfigured state.
- Social drafts and local previews with no fake account connections or
  publishing.

See [`estateflow-web/README.md`](estateflow-web/README.md) for the web-specific
setup, environment variables, data model, and deployment notes.

## Repository layout

```text
lib/                         Flutter source
  core/                      theme, constants, matching, settings scope
  models/                    Property and Client
  services/                  auth, repositories, Firestore, settings
  screens/                   auth, dashboard, properties, clients, settings
  widgets/                   brand lockups, status chip, stat card, Google logo
assets/branding/             Flutter logo, symbol, app icon assets
android/                     Android launcher, adaptive icon, splash resources
web/                         Flutter web manifest, index, icons, splash
estateflow-web/              Next.js web app (separate package)
  public/brand/              Web logo and app-icon assets
  src/components/brand/      Shared web brand components
  src/app/                   App Router routes, metadata, icons, API routes
firebase.json                Firestore, Storage, Auth deployment config
firestore.rules              Deployed shared-workspace rules
firestore.owner-scoped.rules Opt-in stricter rules; not deployed
storage.rules                Private media rules; deploy after Storage is created
firestore.indexes.json       No composite indexes currently required
```

## Firebase

| Item | Value |
| --- | --- |
| Project ID | `estateflow-df9e9` |
| Project number | `353372777164` |
| Firestore database | `(default)`, `nam5` |
| Android package | `com.estateflow.app` |
| Android app ID | `1:353372777164:android:aabbdd6a8c6fd857a87069` |
| iOS app ID | `1:353372777164:ios:a721bbd7f680c488a87069` |
| Web app ID | `1:353372777164:web:e651246b6493aef9a87069` |

Enabled sign-in providers: **Email/Password** and **Google**. Anonymous sign-in
is intentionally disabled. The Android OAuth client is registered against the
debug certificate:

| Certificate | SHA-1 |
| --- | --- |
| debug | `26:A1:21:ED:B5:59:D7:3C:FB:CE:78:81:AC:8E:CF:D0:8C:B3:E9:9D` |

For a release build, add the release keystore's SHA-1 in the Firebase console.

### Collections

- `properties/{id}` — listing details, price, location, status, owner contact.
- `clients/{id}` — client contact, purpose, budget, requirements, status.
- `users/{uid}` — web profile and appearance preferences.
- `users/{uid}/media/{id}` — media metadata only; binaries are in Storage.
- `users/{uid}/socialPosts/{id}` — social drafts and local-preview data.
- `users/{uid}/socialAccounts/{id}` — reserved for server-written account
  metadata; clients can read but not write.
- `users/{uid}/socialPosts/{id}/results/{id}` — reserved for server-written
  publication results; clients can read but not write.

Legacy `properties` and `clients` documents may not have `ownerId` or timestamp
fields. The web dashboard falls back to name order for those records.

### Security rules

`firestore.rules` is deployed and uses the shared-workspace policy:

- Any authenticated user can read/write `properties` and `clients`.
- `users/{uid}` and its media/social subcollections are owner-scoped.
- Social account tokens and publication results are read-only to clients.
- Everything else is denied.

Deploy Firestore rules:

```powershell
npx firebase-tools deploy --only firestore:rules --project estateflow-df9e9
```

`firestore.owner-scoped.rules` is an **opt-in** stricter policy. Do not deploy it
until every legacy property/client document has an `ownerId`; otherwise those
records become invisible. Backfill with a trusted Admin SDK script first, then
copy the file over `firestore.rules` and redeploy.

Storage is not initialized for this project yet. After clicking **Get Started**
in Firebase console → Storage, deploy:

```powershell
npx firebase-tools deploy --only storage --project estateflow-df9e9
```

Media is private to its owner and limited to image content up to 10 MB.

## Setup

### Flutter

The Flutter SDK used for this workspace is at `C:\Users\HP\develop\flutter` and
is not on `PATH` by default:

```powershell
$env:PATH += ";C:\Users\HP\develop\flutter\bin"
flutter pub get
flutter run
```

For the web build:

```powershell
flutter build web
```

For Android:

```powershell
flutter build apk --debug
```

`google-services.json` is already present for the Android app. Google sign-in
reads the OAuth client from that file; no client IDs are hard-coded in Dart.

### Next.js web app

```powershell
cd estateflow-web
npm install
Copy-Item .env.example .env.local
# fill in the Firebase web config and NEXT_PUBLIC_SITE_URL
npm run dev
```

The web app uses `NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_SITE_URL`,
`NEXT_PUBLIC_ENABLE_DEVICE_PREVIEW`, and the optional server-only
`GEMINI_API_KEY`, `GEMINI_IMAGE_MODEL`, and `SOCIAL_TOKEN_ENCRYPTION_KEY`.
See [`estateflow-web/README.md`](estateflow-web/README.md) for the full table.

## Branding

The supplied EstateFlow brand reference is the source of truth. The symbol,
wordmark, and tagline were traced into clean SVG paths; the surrounding
presentation mockup was not used as the logo. Official colors:

- Blue: `#0866F5`
- Navy: `#101D3A`
- Neutral: `#F7F9FC`
- Tagline: **Find • Manage • Grow**

Dedicated light and dark assets are used instead of CSS filters. The full lockup
includes the tagline; compact and symbol variants are used where space is tight.

Web assets live in `estateflow-web/public/brand/` and `estateflow-web/public/icons/`.
The shared components are in `estateflow-web/src/components/brand/`. Web
metadata uses `icon.svg`, `favicon.ico`, `apple-icon.png`,
`opengraph-image.png`, `twitter-image.png`, and `manifest.ts`.

Flutter assets live in `assets/branding/` and are exposed by
`lib/widgets/estateflow_logo.dart`. Android uses:

- adaptive foreground and monochrome vector drawables in
  `android/app/src/main/res/drawable/`;
- adaptive launcher XML in `mipmap-anydpi-v26/`;
- legacy PNG launcher icons in `mipmap-*`;
- vector splash logo, light/dark splash colors, and Android 12+ splash styles.

Flutter web uses `web/index.html` (branded first-frame splash, title, theme
color, Apple icon, favicon) and `web/manifest.json` (name, colors, icons).

## AI and social limitations

The web AI Image Studio and Social Media Hub are intentionally honest:

- Without `GEMINI_API_KEY`, AI generation reports **not configured** and does not
  produce a sample image.
- Social drafts are saved to Firestore, but no platform account is connected and
  nothing is published. There is no OAuth callback, encrypted token store,
  background publisher, or scheduler.

The **Flutter app now includes AI Image Studio, Media Library, and Social Media
Hub screens**. The AI screen calls the existing web API when `ESTATEFLOW_AI_API_URL`
is configured; otherwise it reports that generation is not configured. Media
uploads use Firebase Storage. Social is draft/preview only. The web app no
longer has a Matching page; matching remains available on mobile.

## Tests and validation

Flutter:

```powershell
flutter analyze
flutter test
flutter build web
flutter build apk --debug
```

The Flutter suite currently has **61 passing tests**. It covers money
normalisation, matching, Firestore model round-trips, form behaviour, and
narrow-screen layout.

Web:

```powershell
cd estateflow-web
npx tsc --noEmit
npm run build
```

Manual browser QA covered auth (login, signup, forgot password), dashboard,
settings, properties, clients, matching, media, AI Studio, and Social Hub. All
workspace routes were opened at 1440px. The dashboard was checked at 768px and at
390px in light and dark; settings, AI Studio, Social Hub, and the mobile drawer
were checked at 390px in dark mode. Browser titles and the
drawer/bottom-navigation interaction were checked. The temporary QA accounts,
profiles, and social draft were deleted after the runs.

Android launcher and splash visuals have **not** been verified on a physical
device or emulator in this environment. The Android resources compile and the
debug APK builds successfully.

## Completed vs awaiting configuration

Completed:

- Flutter and Next.js branding, icons, splash assets, metadata, and responsive
  shell integration.
- Flutter app features, 61 tests, web build, and debug APK build.
- Next.js app routes, AI/social honest states, TypeScript, and production build.
- Firestore rules deployment for `estateflow-df9e9`.
- Auth and authenticated web QA with a temporary account that was removed.

Awaiting configuration:

- Firebase Storage initialization and Storage rules deployment.
- `GEMINI_API_KEY` for AI image generation.
- Platform developer apps, OAuth callbacks, encrypted token storage, publisher
  worker, and scheduler for social publishing.
- A production hostname and `NEXT_PUBLIC_SITE_URL` for deployment.
- Release keystore SHA-1 registration for Android release Google sign-in.
- A physical Android device or emulator for launcher/splash/auth visual QA.
- Mobile AI generation requires a deployed EstateFlow web API URL passed via
  `--dart-define=ESTATEFLOW_AI_API_URL=...`.

## Known limitations

- No git repository is initialized in this workspace; all changes are local.
- The shared `properties`/`clients` rules are workspace-wide. The stricter
  owner-scoped policy is not deployed because legacy records lack `ownerId`.
- The AI route's rate limiter is per-instance and best effort.
- Social Hub is a draft/preview tool, not a publisher.
- Firebase Storage is not initialized, so media upload/delete has not been
  verified against a real bucket.
- No Android device/emulator is available for runtime visual verification.
