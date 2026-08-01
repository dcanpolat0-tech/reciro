# Reciro Final Release Readiness

Last updated: July 31, 2026

## Current Status

Reciro is technically prepared for iOS and Android release preparation. The remaining external blockers are Apple Developer Program enrollment approval, Google Play developer approval, AdMob account/payment review, and final store purchase setup.

## Confirmed

- App name: `Reciro`
- Bundle ID: `com.dcanpolat.reciro`
- Version: `1.0.0`
- iOS build number: `1`
- First release target: iPhone only
- Android package is reserved as `com.dcanpolat.reciro`.
- Android microphone permission is not requested because receipt scanning does not need audio.
- Support URL works: `https://reciro-receipt-analysis.onrender.com/support`
- Privacy Policy URL works: `https://reciro-receipt-analysis.onrender.com/privacy`
- Terms of Use URL works: `https://reciro-receipt-analysis.onrender.com/terms`
- Render backend health check works: `https://reciro-receipt-analysis.onrender.com/health`
- iOS Expo export completed successfully.
- Android Expo export completed successfully.
- `expo-doctor` passed all checks.
- No real OpenAI API key is committed to GitHub.
- `.env` is ignored and stays local.
- `.easignore` excludes local secrets and build artifacts from cloud build upload.
- `.expo` is ignored by Git.
- Production EAS build needs `EXPO_PUBLIC_RECEIPT_ANALYSIS_URL` and `EXPO_PUBLIC_ANALYSIS_CLIENT_TOKEN` configured in EAS.

## First Release Choices

- The app opens with a simple local profile choice screen.
- The current Apple / Google wording is local-first only and stores the selected profile on the device. It does not claim real OAuth sign-in.
- Premium paywall and rewarded ads are disabled for the first App Store build until RevenueCat, store products, AdMob review, and native build testing are complete.
- RevenueCat/App Store/Google Play purchase state must be connected before Premium can actually unlock paid features.
- Receipt data is stored locally on the phone in the current release.
- Users can export their own backups and keep them in iCloud Drive, Google Drive, or the Files app. Reciro does not store receipt backups on its own servers.

## Known Notes

- Apple Developer enrollment is required before App Store Connect, TestFlight, and App Store submission can continue.
- Google Play approval is required before production Android publishing can continue.
- Real subscriptions should not be enabled until RevenueCat purchase and restore flows are implemented and tested on both platforms.
- Real Apple/Google OAuth and automatic cross-device sync are planned for a later release. Current data ownership is local/device-first.

## Next Steps After Apple Approval

1. Create the App Store Connect app record.
2. Use Bundle ID `com.dcanpolat.reciro`.
3. Add App Store metadata from `docs/APP_STORE_METADATA.md`.
4. Add support, privacy, and terms URLs.
5. Build with EAS using `docs/BUILD_IOS_WITH_EAS.md`.
6. Upload to TestFlight.
7. Test on a real iPhone using `docs/RELEASE_TEST_PLAN.md`.
8. Capture App Store screenshots using `docs/SCREENSHOT_GUIDE.md`.
9. Submit for Apple review.

## Next Steps After Google Play Approval

1. Create the Google Play app record.
2. Use package `com.dcanpolat.reciro`.
3. Add Google Play metadata from `GOOGLE_PLAY_SUBMISSION_TR.md`.
4. Complete Data Safety, Ads, and Content Rating forms.
5. Create internal testing release with an Android build.
6. Test rewarded ads, camera, gallery, PDF, AI analysis, feedback, and saved receipts.
7. Submit for Google Play review.

Build guide: `docs/BUILD_ANDROID_WITH_EAS.md`.
