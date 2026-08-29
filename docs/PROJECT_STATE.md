# reciro Project State

## Current Architecture

Expo/React Native (SDK 54 in `package.json`) app. The UI and local state are primarily in `App.js`; receipt data is stored device-local with AsyncStorage and files in the app document directory. A small Node HTTP backend performs temporary receipt analysis and serves public/legal endpoints.

## Important Files

- `App.js` — screens, navigation state, local data, receipt workflow, localization, auth, ads and purchase calls.
- `app.json` / `app.config.js` — Expo identifiers, native settings and non-secret runtime environment mapping.
- `revenueCat.js` — optional native RevenueCat module loader.
- `mobileAds.native.js` / `mobileAds.web.js` — platform-safe AdMob module loader.
- `server/receipt-analysis-server.js` — analysis API, rate limiting, feedback, legal pages and `/app-ads.txt`.
- `docs/` — current project memory, release, privacy and store documentation.

## Working Features

- Add receipt by camera, gallery image or PDF; analyze it, review/edit it, save locally and prevent duplicate saves with a recovery path.
- Home, reports, monthly receipts, products and settings flows; search, filters, swipe delete, receipt detail and image preview.
- Local income, budget, recurring expense, currency, category-memory, backup/export and custom-category support.
- Multilingual UI. “Other” can be renamed and custom categories can be created.
- System dark mode is supported across the app and follows the device appearance setting.
- Five free analyses per month; native rewarded-ad credits are granted only after the reward event. Premium is visible on native iOS and Android builds and checks the active RevenueCat entitlement. Android purchasing requires its Google Play and RevenueCat configuration before release.

## Integrations

- **Backend:** Render-hosted receipt analysis endpoint. It requires server environment variables for OpenAI and optional feedback mail; receipts are for temporary analysis, not server-side archives.
- **RevenueCat:** native iOS and Android purchase configuration, offerings, purchase and restore calls are wired through `revenueCat.js`. Android has active Google Play monthly and annual subscriptions, both mapped to the `Reciro Premium` entitlement and the default RevenueCat offering. Google Play service credentials validate successfully, and real-time developer notifications are connected through the `revenuecat-google-play` Pub/Sub topic (test notification received). The Android public SDK key is configured in the client build; a physical-device purchase and restore test is still required before release. SDK identifiers are client configuration, not server secrets.
- **AdMob:** native rewarded-ad configuration exists; `/app-ads.txt` is served by the backend. Ads cannot run in Expo Go.
- **Authentication:** Supabase Auth project `Reciro Auth` is the identity authority. Sessions use SecureStore on native devices. Apple uses a native identity token with a raw nonce passed to Supabase and its SHA-256 hash passed to Apple; Google uses Supabase OAuth with `reciro://auth-callback`. A local profile is always available so an auth-provider outage cannot block access to local-first features. Provider dashboard configuration and physical-device verification are still required before enforcement.
- **Analysis authorization:** the Render server supports verified Supabase bearer sessions when `SUPABASE_AUTH_REQUIRED=true`; leave it false until the Supabase-enabled build is live and verified so existing users are not interrupted.
- **Store:** iOS bundle ID is `com.dcanpolat.reciro`; App Store Connect ID is `6797104975`. EAS production submit is configured in `eas.json`.

## Current UI / Screens

Entry sign-in choice; tab navigation for Home, Report, Monthly, Products and Settings. Receipt add/review/detail, report/category/month drill-downs, data/backup, privacy/legal and developer-connections settings are rendered from the main `App.js` screen flow.

## Important Decisions

- Local-first: receipts and user financial data remain on-device; backups use user-controlled storage.
- Do not put server credentials in Expo config or client code.
- Supabase publishable configuration is allowed in the app; service-role keys and OpenAI keys are server-only.
- Roll out authentication before enabling Render's mandatory Supabase-session check.
- `App.js` is intentionally a large central file; avoid unrelated refactors.
- Daily work is done only in `RECIRO-DEVELOPMENT` on `codex/development`; `main` remains the stable reference.

## Known Issues

- RevenueCat and AdMob delivery still require physical-device verification before release. Android Premium is configured for Google Play. Version code 6 has been added to the Alpha closed-test publishing overview with release notes in all eight locales; Google Play must finish its server-side processing before the submission control becomes available. A purchase and restore check is still required before production release.
- AdMob verification depends on the public App Store Marketing URL being crawled after the related App Store update is live.
- Supabase Apple/Google provider configuration and a physical-device sign-in test are required before `SUPABASE_AUTH_REQUIRED` is enabled on Render.

## Current Development State

Development worktree: `C:\Users\ask_d\Documents\Codex\2026-07-08\si\RECIRO-DEVELOPMENT` on `codex/development`. iOS 1.0.2 build 12 was rejected because Apple could not verify subscription legal links. EAS created and uploaded iOS 1.0.2 build 13 on 2026-08-22, with the legal-link metadata corrected in all App Store localizations. On 2026-08-26 Apple rejected build 13 under Guideline 2.1(a) because Apple and Google sign-in both produced errors on an iPad. The underlying Supabase Auth project had become inactive; it was restored on 2026-08-29. The source now applies the required Apple nonce protocol and always offers a local profile, but a fresh physical iPhone/iPad authentication test and a new build are required before resubmission. Build 10 remains a 1.0.1 TestFlight validation build. Generated `dist-*` folders are temporary and must not be committed.

## Next Relevant Work

- Wait for the restored Supabase project to become active, then validate Google OAuth redirect configuration and Apple/Google login on a physical iPhone and iPad.
- Build a new iOS binary only after those authentication checks pass, then resubmit the app version and its two subscriptions plus subscription group together.
- Complete Android closed testing with the Play tester requirement, then verify Google Play purchase and restore using the Android RevenueCat configuration.
