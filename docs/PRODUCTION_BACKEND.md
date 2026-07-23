# Reciro Production Backend Notes

The current receipt analysis server is in `server/receipt-analysis-server.js`. It works locally and can be moved to a hosted Node.js environment.

## Required Environment Variables

```text
OPENAI_API_KEY=your-production-key
OPENAI_MODEL=gpt-4.1-mini
ANALYSIS_CLIENT_TOKEN=your-long-random-token
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=20
```

The mobile app must point to the public HTTPS endpoint:

```text
EXPO_PUBLIC_RECEIPT_ANALYSIS_URL=https://your-domain.com/analyze-receipt
EXPO_PUBLIC_ANALYSIS_CLIENT_TOKEN=the-same-long-random-token
```

## Production Requirements

- Use HTTPS, not a local network IP.
- Keep `OPENAI_API_KEY` only on the server.
- Do not ship the OpenAI API key inside the app.
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
   - `ANALYSIS_CLIENT_TOKEN`
7. Deploy.
8. Copy the public service URL.
9. Set the app endpoint:

```text
EXPO_PUBLIC_RECEIPT_ANALYSIS_URL=https://your-render-service.onrender.com/analyze-receipt
EXPO_PUBLIC_ANALYSIS_CLIENT_TOKEN=the-same-long-random-token
```

10. Rebuild the app and test on a real phone.

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
3. Add the same client token to server and app env values.
4. Rebuild the app.
5. Test receipt analysis on a real iPhone using mobile data and Wi-Fi.
