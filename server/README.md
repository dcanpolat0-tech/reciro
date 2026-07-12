# Receipt analysis server

This local server receives a receipt image from the Expo app, sends it to OpenAI, and returns structured receipt data.

## Setup

1. Copy `.env.example` to `.env`.
2. Set `OPENAI_API_KEY`.
3. Set `EXPO_PUBLIC_RECEIPT_ANALYSIS_URL` to your Windows computer IP:

```text
EXPO_PUBLIC_RECEIPT_ANALYSIS_URL=http://192.168.1.125:8787/analyze-receipt
```

The phone and Windows computer must be on the same Wi-Fi network.

## Run

Start the analysis server:

```powershell
npm run analysis
```

For production hosts, use:

```powershell
npm run backend:start
```

Start Expo in another terminal after setting the same `.env` values:

```powershell
npm run start
```

## Health check

```powershell
Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:8787/health"
```

## Production

The server supports hosted environments that provide `PORT`, such as Render or Railway. See `docs/PRODUCTION_BACKEND.md`.
