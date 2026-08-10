# Reciro Next Steps

Use this file to continue without rereading the long chat.

## First rule for every new session

Before coding, read:

1. docs/PROJECT_STATE.md
2. docs/NEXT_STEPS.md
3. docs/RELEASE_CHECKLIST.md

Then pick one small batch, implement it, test it, update these docs if the state changes, commit, and push.

## Current priority batch

1. Fix App Store version issues reported by the user:
   - Apple and Google login buttons are not connected.
   - Rewarded ads are not activating after 5 free scans.
   - Duplicate/similar receipt screen can get stuck and needs back/recovery.
   - Payment/Premium flow must be checked.

2. Confirm integrations:
   - RevenueCat product IDs match the App Store products.
   - AdMob iOS rewarded ID is used for iOS builds.
   - Android rewarded ID is used for Android builds.
   - App Store build does not still rely on Expo Go-only behavior.

3. Fix receipt/PDF viewing:
   - Saved PDF receipts should open from every section where receipt details open.
   - Receipt image viewer should allow zoom.
   - Image should remain centered and stable, not slide to the side.

4. Fix list behavior:
   - Swipe delete should reveal a red delete action that follows the finger.
   - Tapping elsewhere closes an open delete action.
   - Delete should work in report archive, monthly lists, and store/category detail lists.

5. Fix report calculations:
   - Monthly income entered in settings should appear in report balance.
   - Home should not show confusing remaining balance if product direction removed it.
   - Recurring yearly expenses should be divided by 12 for monthly totals.

## Product decisions already made

- App name is Reciro.
- App is free to download.
- Free limit is 5 receipt analyses per month.
- Extra scan can be earned with rewarded ad.
- Premium removes scan limits and unlocks all planned premium features.
- User-owned storage direction: iCloud/Google Drive, not our own permanent server.
- Phone language should control app language automatically; no manual language setting inside settings.
- Currency should be detected from receipt where possible, with user setting as fallback.

## Recommended workflow for expensive context

- Do not ask the user to repeat old details if they are in PROJECT_STATE.md.
- Do not paste long logs into chat unless needed.
- Keep changes in small commits.
- After any meaningful change, update PROJECT_STATE.md or this file with the new truth.
- Push to GitHub only after tests or a sensible local check.

## Suggested next command checks

Run these from the project folder when terminal is available:

```powershell
cd "C:\Users\ask_d\Documents\Codex\2026-07-08\si\Reciro"
npm test
npx expo-doctor
npx eas-cli build:list --platform ios --limit 3
```

If npm scripts differ, inspect package.json first.
