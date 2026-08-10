# Reciro Project State

Last updated: 2026-08-08

## Product

- App name: Reciro - Smart Receipt Scanner
- Brand: Reciro
- Slogan: Scan. Save. Simplify.
- Purpose: simple receipt scanning and expense tracking. Users add a receipt photo, gallery image, or PDF; AI extracts store, date, total, products, quantities, categories, and currency.
- Main promise: fast, simple, low-confusion receipt tracking for weekly, monthly, yearly, and all-time spending.

## User and workflow

- User is beginner in coding and uses Windows, not Mac.
- Preferred workflow: explain step by step in Turkish, but implement directly when possible.
- Do not rely on the old long chat. Start each new session by reading:
  - docs/PROJECT_STATE.md
  - docs/NEXT_STEPS.md
  - docs/RELEASE_CHECKLIST.md

## Local project

- Main folder: C:\Users\ask_d\Documents\Codex\2026-07-08\si\Reciro
- GitHub repo: https://github.com/dcanpolat0-tech/reciro
- Expo project: @denizcanpolat2307/reciro
- iOS bundle ID: com.dcanpolat.reciro
- App Store app ID: 6797104975

## Backend and AI

- Receipt analysis backend: https://reciro-receipt-analysis.onrender.com
- Render dashboard service: https://dashboard.render.com/web/srv-d9h8c3t8nd3s73cdes6g
- OpenAI API keys page: https://platform.openai.com/api-keys
- Important rule: backend analyzes receipt images/PDFs only to extract details. It must not become permanent user storage.

## Data model and privacy direction

- Local-first product direction.
- User data should stay on the user's device.
- Future sync/backup should use user-owned storage:
  - iCloud for Apple users
  - Google Drive for Google/Android users
- We do not want to keep personal receipt archives on our own server.
- Receipt photos/PDFs may be temporarily sent to the analysis backend for OCR/AI extraction.

## Monetization

- App Store app price: free.
- Free plan: 5 receipt analyses per month.
- After 5 free scans: user can either watch a rewarded ad for 1 extra scan or upgrade to Premium.
- Premium monthly: 1.99 EUR.
- Premium yearly: 10 percent discount, about 21.49 EUR/year.
- RevenueCat setup was started, but payment logic must be checked before relying on it in production.
- AdMob rewarded ads should unlock extra scans after the free limit.

## AdMob

- Android app ID: ca-app-pub-8547815405822008~3094032770
- Android rewarded ad unit: ca-app-pub-8547815405822008/8421426783
- iOS app ID: ca-app-pub-8547815405822008~5448733377
- iOS rewarded ad unit: ca-app-pub-8547815405822008/1911858751
- AdMob account was still pending/verification in earlier setup. Real ads may not serve until Google approval completes.

## App Store status

- iOS build 2 was uploaded through EAS.
- App Store Connect reached review/submission flow.
- User later reported the app is active/open from Turkey App Store, not Expo Go.
- Current user testing is from the real App Store version unless explicitly stated otherwise.

## Current important issues reported by user

- Apple and Google login buttons are visible but not connected.
- After 5 free receipt analyses, rewarded ad flow does not activate.
- If a similar/duplicate receipt is detected, the flow can get stuck and needs a back button/recovery path.
- Premium/payment method needs App Store/RevenueCat wiring checked.
- PDF receipts can be saved but cannot always be opened from all sections.
- Receipt image viewer should support zoom and should not drift/slide strangely.
- Swipe-to-delete should work in report/month/archive lists and close when tapping elsewhere.
- "Toplami urunlerden hesapla" is unclear and/or not functioning correctly.
- Report section should show income/balance when monthly income is entered.
- Home "recent uploads" should sort by app upload/save time; reports/months should sort by receipt date.

## Quality principle

- Keep each section focused:
  - Home: summary, recent uploads, quick receipt add.
  - Report: category/store/month reporting.
  - Monthly: month-by-month receipt lists.
  - Products: product summary by selected month/year/all-time.
  - Settings: account, money/budget, monthly payments, receipt analysis, data, privacy/legal, help/feedback.
