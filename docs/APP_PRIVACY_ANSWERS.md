# Reciro App Privacy Answers

Last updated: July 27, 2026

Use this when App Store Connect asks for App Privacy information. For Google Play, use `GOOGLE_PLAY_SUBMISSION_TR.md`.

This is a practical draft based on the current release. Review it again before final submission.

## Data Used By The App

### User Content

Examples:

- Receipt photos
- PDF receipts or documents
- Receipt item names
- Store names
- Receipt totals
- Receipt dates
- Categories
- Feedback messages

Purpose:

- App functionality
- Receipt analysis
- Expense tracking
- Customer support when the user sends feedback

Linked to user:

- In the current release, receipt data is mainly stored on the device.
- If AI analysis is used, the receipt image or PDF is sent to the Reciro analysis server and processed by AI.

Tracking:

- Rewarded ads are planned through Google AdMob. If Apple's tracking permission is required for personalized advertising, it must be reviewed before release.

### Financial Info

Examples:

- Monthly income value entered by the user
- Spending totals calculated from receipts

Purpose:

- App functionality
- Budget and spending reports

Tracking:

- No.

### Purchases

Examples:

- Future paid subscription state after App Store / Google Play subscriptions are connected

Purpose:

- App functionality

Handled by:

- App Store or Google Play purchase system, coordinated later through RevenueCat

### Identifiers

Examples:

- Local app storage keys
- Future account identifiers if cloud login is connected fully

Purpose:

- App functionality

Tracking:

- No.

## Data Not Currently Intended

- Health data
- Fitness data
- Contacts
- Precise location
- Browsing history
- Search history
- Third-party advertising tracking beyond the rewarded ad provider setup

## Notes For Apple Review

Reciro uses receipt photos only when the user chooses a photo or takes a photo. The app explains that AI can make mistakes and allows users to edit results before saving.
