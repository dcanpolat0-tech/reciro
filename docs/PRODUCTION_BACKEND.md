# Reciro Production Backend Notes

The current receipt analysis server is in `server/receipt-analysis-server.js`. It works locally and can be moved to a hosted Node.js environment.

## Required Environment Variables

```text
OPENAI_API_KEY=your-production-key
OPENAI_MODEL=gpt-4.1-mini
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=20
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_public_key
SUPABASE_AUTH_REQUIRED=false
```

The mobile app must point to the public HTTPS endpoint. Supabase URL and
publishable key are public mobile configuration, not server secrets:

```text
EXPO_PUBLIC_RECEIPT_ANALYSIS_URL=https://reciro-receipt-analysis.onrender.com/analyze-receipt
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_public_key
```

## Production Requirements

- Use HTTPS, not a local network IP.
- Keep `OPENAI_API_KEY` only on the server.
- Do not ship the OpenAI API key inside the app.
- Do not use `EXPO_PUBLIC_ANALYSIS_CLIENT_TOKEN` as security. Every value in a
  mobile build can be extracted.
- When `SUPABASE_AUTH_REQUIRED=true`, the server validates the user's
  Supabase access token with Supabase before receipt analysis.
- Add request limits before launch to control AI cost.
- Add logging for failed analysis requests.
- Add monitoring for server uptime.

## Render Deployment

This project includes `render.yaml`.

1. Push the project to GitHub.
2. Open Render.
3. Choose New > Blueprint.
4. Connect the GitHub repository.
5. Render will detect `render.yaml`.
6. Add secret environment variables:
   - `OPENAI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_AUTH_REQUIRED=false`
7. Deploy.
8. Copy the public service URL.
9. Set the app endpoint:

```text
EXPO_PUBLIC_RECEIPT_ANALYSIS_URL=https://reciro-receipt-analysis.onrender.com/analyze-receipt
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_public_key
```

10. Rebuild the app and test Apple and Google sign-in on a real phone.
11. Only after the new build is live and verified, change Render
    `SUPABASE_AUTH_REQUIRED` to `true` and redeploy. This prevents older app
    versions from losing receipt analysis during the rollout.

## Suggested Hosting

Good first options:

- Render
- Railway
- Fly.io
- DigitalOcean App Platform

For the first public version, choose the simplest Node.js host with HTTPS and environment variables.

## Before App Store Release

1. Deploy the server publicly.
2. Update `.env` with the public HTTPS analysis endpoint.
3. Configure Supabase Apple and Google providers, including
   `reciro://auth-callback` as an allowed mobile redirect URL.
4. Rebuild the app.
5. Test sign-in and receipt analysis on a real iPhone using mobile data and Wi-Fi.
6. Turn on `SUPABASE_AUTH_REQUIRED` only after that test succeeds.
