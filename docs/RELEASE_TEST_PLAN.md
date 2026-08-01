# Reciro Release Test Plan

Last updated: July 31, 2026

Run this test on a real iPhone and a real Android device before each release.

## Fresh Install

- Delete the app from the phone.
- Install the latest build.
- Open the app.
- Confirm the app opens with the Reciro local profile choice screen.
- Choose Apple and confirm the app opens.
- Clear app data or reinstall, choose Google, and confirm the app opens.
- Confirm the selected provider remains saved after closing and reopening the app.

## Language And Currency

- Set phone language to Turkish and open the app.
- Set phone language to English, French, German, Spanish, Italian, Portuguese, and Dutch when possible.
- Confirm bottom tabs, settings, reports, categories, buttons, and empty states use the phone language.
- If the phone language is not supported, confirm the app falls back to English.
- Scan or enter receipts using EUR, TRY, GBP, and USD where possible.
- Confirm receipt detail preserves the detected or entered receipt currency.
- Confirm Home, Reports, receipt detail, Monthly receipts, and Products show totals consistently.

## Receipt Adding

- Tap `Add receipt` / `Fiş ekle` on Home.
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
- Confirm income, spending, monthly payments, and balance are consistent for the selected period.
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

- Confirm Premium paywall is not presented as a working purchase flow in the first release build.
- Confirm rewarded ads are not required for core receipt entry in the first release build.
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
