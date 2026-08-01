# Reciro App Store Checklist

Last updated: July 31, 2026

Use this checklist before sending Reciro to Apple review.

## App Identity

- App name: `Reciro`
- Bundle identifier: `com.dcanpolat.reciro`
- App icon is final and visible on iPhone home screen.
- Splash screen opens cleanly.
- First release targets iPhone only. iPad support is disabled until tablet layouts are tested.
- App language defaults to the phone language when supported.
- If the phone language is not supported, the app opens in English.
- First launch shows Apple / Google account choice. Current selection is stored locally until real OAuth is connected.

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

## Subscriptions And Premium

- Current app setting: Premium screen and free limit are visible, but real subscription purchase is not connected yet.
- The Premium button currently shows an informational message until RevenueCat/App Store/Google Play purchases are connected.
- When paid release is ready:
  - Create monthly subscription: `Reciro Premium Monthly`.
  - Create yearly subscription: `Reciro Premium Yearly`.
  - Suggested prices:
    - Monthly: EUR 1.99
    - Yearly: EUR 21.49
  - Free plan limit should become 5 AI receipt analyses per month.
  - Premium should unlock unlimited AI receipt analysis.
  - RevenueCat entitlement and purchase restore must be connected before treating users as Premium.

## Backend

- Render service is deployed and healthy.
- `OPENAI_API_KEY` exists only on Render, never inside the app.
- `ANALYSIS_CLIENT_TOKEN` exists on Render.
- App uses the matching public analysis URL and client token.
- Receipt analysis works on mobile data, not only home Wi-Fi.
- If analysis fails, the user can still enter receipt details manually.

## Required Public Pages

These need public web URLs before App Store submission:

- Privacy Policy: `https://reciro-receipt-analysis.onrender.com/privacy`
- Terms of Use: `https://reciro-receipt-analysis.onrender.com/terms`
- Support / Contact page: `https://reciro-receipt-analysis.onrender.com/support`

Current local drafts:

- `docs/PRIVACY_POLICY.md`
- `docs/TERMS_OF_USE.md`
- `docs/PRODUCTION_BACKEND.md`
- `docs/APP_PRIVACY_ANSWERS.md`
- `docs/BUILD_IOS_WITH_EAS.md`
- `docs/SCREENSHOT_GUIDE.md`

## Data And Trust

- Receipt photos are shown again in saved receipt detail.
- PDF receipts can be saved and manually completed.
- Users can edit AI analysis results before saving.
- Users can re-analyze a receipt when AI reads it badly.
- Users can add a custom category from `Other`.
- Feedback is sent to `denizcanpolat2307@gmail.com`.
- Rewarded ads are planned for extra scan credits after the free monthly limit.
- Apple / Google entry screen is visible, but it is local-first until real OAuth credentials are connected in a later native build step.
- User data remains on the device. User-controlled export can be saved to iCloud Drive, Google Drive, or Files.
- No real API keys are committed to GitHub.

## Final Device Test

Follow `docs/RELEASE_TEST_PLAN.md` before release.
