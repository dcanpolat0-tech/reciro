# Nereye App Store Checklist

Last updated: July 13, 2026

Use this checklist before sending Nereye to Apple review.

## App Identity

- App name: `Nereye`
- Bundle identifier: `com.dcanpolat.nereye`
- App icon is final and visible on iPhone home screen.
- Splash screen opens cleanly.
- App language defaults to the phone language when supported.
- If the phone language is not supported, the app opens in English.

## Apple Developer

- Create the app record in App Store Connect.
- Add app category: Finance.
- Add age rating.
- Add support URL.
- Add privacy policy URL.
- Add terms of use URL if subscriptions are enabled.
- Add iPhone screenshots.
- Add App Store description, subtitle, keywords, and promotional text from `docs/APP_STORE_METADATA.md`.
- Complete App Privacy answers based on the current privacy policy.

## Subscriptions

- Create monthly subscription: `Nereye Premium Monthly`.
- Create yearly subscription: `Nereye Premium Yearly`.
- Suggested prices:
  - Monthly: EUR 2.99
  - Yearly: EUR 24.99
- Free plan limit: 5 AI receipt analyses per month.
- Premium should unlock unlimited AI receipt analysis.
- Apple purchase state still needs to be connected to the app before paid release.

## Backend

- Render service is deployed and healthy.
- `OPENAI_API_KEY` exists only on Render, never inside the app.
- `ANALYSIS_CLIENT_TOKEN` exists on Render.
- App uses the matching public analysis URL and client token.
- Receipt analysis works on mobile data, not only home Wi-Fi.
- If analysis fails, the user can still enter receipt details manually.

## Required Public Pages

These need public web URLs before App Store submission:

- Privacy Policy: `https://dcanpolat0-tech.github.io/nereye/privacy.html`
- Terms of Use: `https://dcanpolat0-tech.github.io/nereye/terms.html`
- Support / Contact page: `https://dcanpolat0-tech.github.io/nereye/`

Current local drafts:

- `docs/PRIVACY_POLICY.md`
- `docs/TERMS_OF_USE.md`
- `docs/PRODUCTION_BACKEND.md`
- `docs/APP_PRIVACY_ANSWERS.md`
- `docs/BUILD_IOS_WITH_EAS.md`
- `docs/SCREENSHOT_GUIDE.md`

## Data And Trust

- Receipt photos are shown again in saved receipt detail.
- Users can edit AI analysis results before saving.
- Users can re-analyze a receipt when AI reads it badly.
- Users can add a custom category from `Other`.
- Feedback email opens to `dcanpolat0@gmail.com`.
- No real API keys are committed to GitHub.

## Final Device Test

Follow `docs/RELEASE_TEST_PLAN.md` before release.
