# Nereye Final Release Readiness

Last updated: July 14, 2026

## Current Status

Nereye is technically prepared for the first iPhone release path. The remaining external blocker is Apple Developer Program enrollment approval.

## Confirmed

- App name: `Nereye`
- Bundle ID: `com.dcanpolat.nereye`
- Version: `1.0.0`
- iOS build number: `1`
- First release target: iPhone only
- Android package is reserved as `com.dcanpolat.nereye`.
- Android microphone permission is not requested because receipt scanning does not need audio.
- Support URL works: `https://dcanpolat0-tech.github.io/nereye/`
- Privacy Policy URL works: `https://dcanpolat0-tech.github.io/nereye/privacy.html`
- Terms of Use URL works: `https://dcanpolat0-tech.github.io/nereye/terms.html`
- Render backend health check works: `https://nereye-receipt-analysis.onrender.com/health`
- iOS Expo export completed successfully.
- No real OpenAI API key is committed to GitHub.
- `.env` is ignored and stays local.
- `.easignore` excludes local secrets and build artifacts from cloud build upload.
- `.expo` is ignored by Git.
- Production EAS build needs `EXPO_PUBLIC_RECEIPT_ANALYSIS_URL` and `EXPO_PUBLIC_ANALYSIS_CLIENT_TOKEN` configured in EAS.

## First Release Choices

- The app opens directly to Home.
- Inactive Apple/Google sign-in gate is disabled.
- Premium paywall is hidden until real Apple subscriptions are connected.
- Receipt analysis is not blocked by an inactive purchase flow.
- Receipt data is stored locally on the phone in the current release.

## Known Notes

- `expo-doctor` reports a `.expo` ignore warning, but Git confirms `.expo` is ignored. This appears to be a local/Windows false positive.
- Apple Developer enrollment is required before App Store Connect, TestFlight, and App Store submission can continue.
- Real Apple subscriptions should not be enabled until purchase and restore flows are implemented and tested.
- Cloud sync/login is planned for a later release.

## Next Steps After Apple Approval

1. Create the App Store Connect app record.
2. Use Bundle ID `com.dcanpolat.nereye`.
3. Add App Store metadata from `docs/APP_STORE_METADATA.md`.
4. Add support, privacy, and terms URLs.
5. Build with EAS using `docs/BUILD_IOS_WITH_EAS.md`.
6. Upload to TestFlight.
7. Test on a real iPhone using `docs/RELEASE_TEST_PLAN.md`.
8. Capture App Store screenshots using `docs/SCREENSHOT_GUIDE.md`.
9. Submit for Apple review.
