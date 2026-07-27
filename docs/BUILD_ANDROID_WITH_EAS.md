# Reciro Android Build Guide

Last updated: July 28, 2026

Use this guide after the Google Play developer account is approved, or earlier if you want an APK test build.

## What We Need First

- Expo account login on this computer.
- Google Play developer account approved for production publishing.
- App record created in Google Play Console when publishing.
- Android package: `com.dcanpolat.reciro`.
- Support URL: `https://reciro-receipt-analysis.onrender.com/support`
- Privacy Policy URL: `https://reciro-receipt-analysis.onrender.com/privacy`
- Terms of Use URL: `https://reciro-receipt-analysis.onrender.com/terms`
- EAS/Expo environment variables added for the mobile build.

## Required EAS Environment Variables

The backend OpenAI key must stay only on Render. The Android app only needs the public analysis URL and the app client token.

Add these to the Expo/EAS project before production or preview builds:

```bash
npx eas-cli env:create --name EXPO_PUBLIC_RECEIPT_ANALYSIS_URL --value https://reciro-receipt-analysis.onrender.com/analyze-receipt --environment production
npx eas-cli env:create --name EXPO_PUBLIC_ANALYSIS_CLIENT_TOKEN --environment production
```

When asked for the token value, paste the same client token used in Render as `ANALYSIS_CLIENT_TOKEN`.

Do not add `OPENAI_API_KEY` to the mobile app environment.

## Login

```bash
npx eas-cli login
npx eas-cli whoami
```

`whoami` should show your Expo username. If it says `Not logged in`, build cannot start.

## APK Test Build

Use this first for real Android device testing:

```bash
npx eas-cli build --platform android --profile preview
```

This creates an APK that can be installed on a real Android phone. Use it to test:

- Camera
- Gallery
- PDF selection
- AI analysis through Render
- Feedback email service
- Rewarded AdMob flow
- Saved receipt archive
- Monthly reports
- Product reports

## Google Play Production Build

Use this when Google Play Console is ready:

```bash
npx eas-cli build --platform android --profile production
```

This creates an AAB file for Google Play.

## Submit To Google Play

After the app exists in Google Play Console and credentials are ready:

```bash
npx eas-cli submit --platform android --profile production
```

If submit is not configured yet, upload the AAB manually in Google Play Console.

## Before Publishing

- Complete Google Play Data Safety using `GOOGLE_PLAY_SUBMISSION_TR.md`.
- Complete Ads declaration: Reciro uses rewarded ads.
- Complete Content Rating.
- Add support, privacy, and terms URLs.
- Add screenshots.
- Test an internal testing release on a real Android phone.
- Do not activate real Premium purchases until RevenueCat and Google Play subscriptions are connected and tested.

## Version Rules

- `app.json` version is the public app version.
- `android.versionCode` is the Android build number.
- For every Google Play upload, increase `versionCode` or let EAS auto-increment it.
