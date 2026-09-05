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

- Add receipt by camera, gallery image or PDF; show an isolated progress indicator while analysis runs, then review/edit the completed result, save locally and prevent duplicate saves with a recovery path.
- Home, reports, monthly receipts, products and settings flows; search, filters, swipe delete, receipt detail and image preview.
- Local income, budget, recurring expense, currency, category-memory, backup/export and custom-category support.
- Multilingual UI. “Other” can be renamed and custom categories can be created.
- System dark mode is supported across the app and follows the device appearance setting.
- Five free analyses per month; native rewarded-ad credits are granted only after the reward event. Expo Go clearly reports that ads are unsupported, while failed ad loads never grant a credit. Premium is visible on native iOS and Android builds, offers direct monthly and yearly purchase choices, and checks the active RevenueCat entitlement. Android purchasing requires its Google Play and RevenueCat configuration before release.

## Integrations

- **Backend:** Render-hosted receipt analysis endpoint. It requires server environment variables for OpenAI and optional feedback mail; receipts are for temporary analysis, not server-side archives.
- **RevenueCat:** native iOS and Android purchase configuration, offerings, purchase and restore calls are wired through `revenueCat.js`. Android has active Google Play monthly and annual subscriptions, both mapped to the `Reciro Premium` entitlement and the default RevenueCat offering. Google Play service credentials validate successfully, and real-time developer notifications are connected through the `revenuecat-google-play` Pub/Sub topic (test notification received). The Android public SDK key is configured in the client build; a physical-device purchase and restore test is still required before release. SDK identifiers are client configuration, not server secrets.
- **AdMob:** native rewarded-ad configuration exists; the backend serves the required `app-ads.txt` declaration at the public root and under the public privacy/support paths. Ads cannot run in Expo Go.
- **Authentication:** Supabase Auth project `Reciro Auth` is the identity authority. Sessions use SecureStore on native devices. Apple uses a native identity token with a raw nonce passed to Supabase and its SHA-256 hash passed to Apple. Google on iOS uses the native Google account picker, then exchanges its identity token directly with Supabase; it does not open a Supabase browser URL. On 2026-09-05 the paused project was resumed and its Google provider was verified live. A local profile is always available so an auth-provider outage cannot block access to local-first features. Physical-device verification is still required before enforcement.
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
- AdMob still needs to recheck the public App Store crawl after the Render deployment; its iOS app-ads.txt review is currently pending.
- A physical-device Apple/Google sign-in test is required before `SUPABASE_AUTH_REQUIRED` is enabled on Render.

## Current Development State

Development worktree: `C:\Users\ask_d\Documents\Codex\2026-07-08\si\RECIRO-DEVELOPMENT` on `codex/development`. iOS 1.0.2 is approved and ready for distribution. The source now uses the native iOS Google account picker and direct Supabase identity-token sign-in, as well as the required Apple nonce protocol. EAS production build 15 completed from the earlier 1.0.2 source and is not the new release candidate. Version 1.0.3 requires its own build from the current source before App Store submission. Build 10 remains a 1.0.1 TestFlight validation build. Generated `dist-*` folders are temporary and must not be committed.

## Next Relevant Work

- Build version 1.0.3 from the current source, then validate Apple/Google login on a physical iPhone and iPad.
- After physical authentication checks pass, submit the new app version for App Review.
- Complete Android closed testing with the Play tester requirement, then verify Google Play purchase and restore using the Android RevenueCat configuration.
