# Nereye iOS Build Guide

Last updated: July 14, 2026

Use this guide after the Apple Developer Program enrollment is approved.

## What We Need First

- Apple Developer Program active.
- App Store Connect access working.
- App record created for `Nereye`.
- Bundle ID: `com.dcanpolat.nereye`.
- Support URL: `https://dcanpolat0-tech.github.io/nereye/`
- Privacy Policy URL: `https://dcanpolat0-tech.github.io/nereye/privacy.html`
- Terms of Use URL: `https://dcanpolat0-tech.github.io/nereye/terms.html`
- EAS/Expo environment variables added for the mobile build.

## Required EAS Environment Variables

The backend OpenAI key must stay only on Render. The mobile app only needs the public analysis URL and the app client token.

Add these to the Expo/EAS project before the production build:

```bash
npx eas-cli env:create --name EXPO_PUBLIC_RECEIPT_ANALYSIS_URL --value https://nereye-receipt-analysis.onrender.com/analyze-receipt --environment production
npx eas-cli env:create --name EXPO_PUBLIC_ANALYSIS_CLIENT_TOKEN --environment production
```

When asked for the token value, paste the same client token used in Render as `ANALYSIS_CLIENT_TOKEN`.

Do not add `OPENAI_API_KEY` to the mobile app environment.

## Build With EAS

Because development is on Windows, use Expo Application Services to build the iPhone app in the cloud.

1. Sign in to Expo:

   ```bash
   npx expo login
   ```

2. Configure EAS if needed:

   ```bash
   npx eas-cli build:configure
   ```

3. Create the production iOS build:

   ```bash
   npx eas-cli build --platform ios --profile production
   ```

4. When the build finishes, submit to App Store Connect:

   ```bash
   npx eas-cli submit --platform ios --profile production
   ```

## Before Submitting

- Test the app on a real iPhone with Expo Go.
- Confirm receipt analysis works through Render.
- Confirm camera and gallery permissions are clear.
- Confirm first release has no inactive Apple/Google sign-in gate.
- Confirm Premium paywall is hidden until Apple subscriptions are connected.
- Confirm the support, privacy, and terms links open.

## Version Rules

- `app.json` version is the public app version.
- `ios.buildNumber` is the Apple build number.
- For every App Store upload, increase the build number or let EAS auto-increment it.

## Important

Do not put `OPENAI_API_KEY` inside the mobile app. It must stay only on Render.
