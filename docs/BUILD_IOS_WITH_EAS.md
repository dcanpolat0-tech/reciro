# Nereye iOS Build Guide

Last updated: July 13, 2026

Use this guide after the Apple Developer Program enrollment is approved.

## What We Need First

- Apple Developer Program active.
- App Store Connect access working.
- App record created for `Nereye`.
- Bundle ID: `com.dcanpolat.nereye`.
- Support URL: `https://dcanpolat0-tech.github.io/nereye/`
- Privacy Policy URL: `https://dcanpolat0-tech.github.io/nereye/privacy.html`
- Terms of Use URL: `https://dcanpolat0-tech.github.io/nereye/terms.html`

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
- Confirm free limit is 5 AI analyses per month.
- Confirm Premium copy is visible but Apple subscriptions are connected before paid release.
- Confirm the support, privacy, and terms links open.

## Version Rules

- `app.json` version is the public app version.
- `ios.buildNumber` is the Apple build number.
- For every App Store upload, increase the build number or let EAS auto-increment it.

## Important

Do not put `OPENAI_API_KEY` inside the mobile app. It must stay only on Render.
