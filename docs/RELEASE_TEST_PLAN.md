# Reciro Release Test Plan

Last updated: July 27, 2026

Run this test on a real iPhone and a real Android device before each release.

## Fresh Install

- Delete the app from the phone.
- Install the latest build.
- Open the app.
- Confirm the app opens directly to Home.
- Confirm there is no inactive Apple/Google sign-in gate in the first release.

## Language And Currency

- Set phone language to Turkish and open the app.
- Set phone language to English, French, German, Spanish, Italian, Portuguese, and Dutch when possible.
- Confirm bottom tabs, settings, reports, categories, buttons, and empty states use the phone language.
- If the phone language is not supported, confirm the app falls back to English.
- Change currency to TRY, EUR, and GBP.
- Confirm Home, Reports, receipt detail, and Products use the selected currency.

## Receipt Adding

- Tap `Fiş Ekle` on Home.
- Confirm camera and gallery choices open above the button.
- Add a receipt with camera.
- Add a receipt with gallery.
- Confirm analysis starts automatically after choosing a photo.
- Confirm manual entry still works if analysis fails.

## AI Analysis Review

- Confirm store name, total, date, category, and products are filled.
- Edit product name.
- Edit quantity.
- Edit unit.
- Edit product price with decimals, for example `55,84`.
- Confirm values do not round to `56` or become `5.584`.
- Select `Other` category and type a custom category.
- Tap re-analyze and confirm the screen updates without losing the photo.
- Save the receipt.

## Saved Receipts

- Confirm saved receipt appears under recent receipts.
- Open receipt detail from Home.
- Open receipt detail from Reports.
- Tap the receipt photo and zoom it.
- Confirm the photo can be closed.
- Delete a receipt and confirm totals update.

## Reports

- Confirm monthly total matches saved receipts.
- Confirm remaining money uses the selected month income correctly.
- Confirm category totals are correct.
- Confirm fuel receipts appear under Fuel/Yakıt.
- Tap a store in Markets and stores.
- Confirm only that store's receipts are shown.
- Search by store, product, category, date, and amount.

## Products

- Confirm products are sorted by quantity, not by price.
- Confirm the top product is the most purchased item.
- Confirm product names, counts, units, receipt count, and total price are readable.

## Free Limit, Ads, And Premium

- Confirm the monthly free limit is 5 AI analyses.
- Confirm the Premium screen explains that real purchases are coming through App Store / Google Play.
- Confirm rewarded ad flow grants an extra analysis credit in the correct build type.
- Confirm manual entry remains available.
- Before paid release, connect real RevenueCat subscriptions and test purchase and restore on iOS and Android.

## Feedback

- Open Settings.
- Tap Feedback.
- Confirm feedback is sent to `denizcanpolat2307@gmail.com`.
- Confirm subject/body are understandable.

## Backend

- Test analysis on Wi-Fi.
- Test analysis on mobile data.
- Test when Render wakes from sleep.
- Confirm the app shows a friendly message if the service is unavailable.

## Final Pass

- No screen has overlapping text.
- Bottom menu does not cover important buttons.
- Back swipe stays inside the current section.
- All main sections feel simple: Home, Reports, Products, Settings.
- No test receipt with private personal information is used in screenshots.
