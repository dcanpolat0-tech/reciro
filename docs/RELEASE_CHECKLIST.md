# Reciro Release Checklist

Use before every App Store or Play Store release.

## Code checks

- No secret keys committed to GitHub.
- OpenAI API key exists only in Render/EAS environment variables.
- AdMob and RevenueCat keys are public SDK keys only.
- App opens from installed build, not only Expo Go.
- Camera permission flow works.
- Gallery import works.
- PDF import works.
- Receipt analysis works with real backend.
- Manual receipt save works when AI fails.
- Duplicate receipt flow has a clear back/cancel path.

## Core QA

- Add receipt by camera.
- Add receipt from gallery.
- Add receipt from PDF.
- Save receipt after AI analysis.
- Save receipt manually without AI.
- Open saved receipt image.
- Zoom saved receipt image.
- Open saved PDF receipt.
- Edit receipt.
- Delete receipt with swipe.
- Confirm lists update after delete.
- Confirm home recent uploads sort by upload/save time.
- Confirm reports and monthly pages sort by receipt date.

## Money and reports

- Monthly income entry works.
- Monthly payments are included in monthly total.
- Yearly recurring payments divide by 12 in monthly totals.
- Store totals are correct.
- Category totals are correct.
- Product quantities and totals are correct.
- Currency is detected from receipt when possible.
- Fallback currency works when receipt currency is missing.

## Monetization

- Free limit is 5 analyses/month.
- After 5 scans, app shows Premium or rewarded ad.
- Rewarded ad grants 1 extra scan.
- Premium purchase screen opens.
- Restore purchases works.
- Monthly product is 1.99 EUR.
- Yearly product is about 21.49 EUR.
- RevenueCat offering/product IDs match App Store Connect.

## Store metadata

- App name: Reciro.
- Subtitle and screenshots exist for each required locale.
- Privacy policy URL is filled for every locale.
- Support URL is filled.
- Primary category is selected.
- Content rights are filled.
- Price tier is selected.
- App privacy answers match actual behavior.
- Age rating is completed.

## External dashboards

- GitHub: https://github.com/dcanpolat0-tech/reciro
- Render backend: https://reciro-receipt-analysis.onrender.com
- Render dashboard: https://dashboard.render.com/web/srv-d9h8c3t8nd3s73cdes6g
- OpenAI API keys: https://platform.openai.com/api-keys
- App Store Connect app: https://appstoreconnect.apple.com/apps/6797104975
- Expo project/builds: https://expo.dev/accounts/denizcanpolat2307/projects/reciro

## Useful release commands

```powershell
cd "C:\Users\ask_d\Documents\Codex\2026-07-08\si\Reciro"
npx expo-doctor
npx eas-cli build -p ios --profile production
npx eas-cli submit -p ios --latest
```

If Git is unavailable on Windows, install Git or set EAS_NO_VCS=1 only when you know the exact project folder is correct.
