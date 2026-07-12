# Nereye App Store Checklist

Use this before public release.

## Apple Developer

- Create or use an Apple Developer account.
- Create the app record with the name `Nereye`.
- Set the bundle identifier.
- Add screenshots for iPhone sizes.
- Add support URL.
- Add privacy policy URL.

## Subscriptions

- Create monthly subscription: `Nereye Premium Monthly`.
- Create yearly subscription: `Nereye Premium Yearly`.
- Suggested prices:
  - Monthly: EUR 2.99
  - Yearly: EUR 24.99
- Connect the app purchase state to `isPremium` in `App.js`.

## Backend

- Deploy `server/receipt-analysis-server.js` to a public HTTPS host.
- Set `OPENAI_API_KEY` only on the server.
- Set `ANALYSIS_CLIENT_TOKEN` on the server.
- Update `EXPO_PUBLIC_RECEIPT_ANALYSIS_URL` to the public HTTPS endpoint.
- Set `EXPO_PUBLIC_ANALYSIS_CLIENT_TOKEN` in the app env.
- Test receipt analysis outside the home Wi-Fi network.

## Required Pages

- Privacy Policy
- Terms of Use
- Support / Contact page

Current local drafts:

- `docs/PRIVACY_POLICY.md`
- `docs/TERMS_OF_USE.md`
- `docs/PRODUCTION_BACKEND.md`

## Final Device Test

- Fresh install
- Login choice
- Add receipt with camera
- Add receipt with gallery
- Confirm receipt save
- Check Home, Report, Products, Settings
- Verify free monthly limit
- Verify Premium screen
- Verify language and currency selection
