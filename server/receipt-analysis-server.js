const http = require('http');
const fs = require('fs');
const path = require('path');

loadEnvFile(path.join(__dirname, '..', '.env'));

const PORT = Number(process.env.PORT || process.env.RECEIPT_ANALYSIS_PORT || 8787);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const ANALYSIS_CLIENT_TOKEN = process.env.ANALYSIS_CLIENT_TOKEN || '';
const MAX_BODY_BYTES = 18 * 1024 * 1024;
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60 * 1000);
const RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 20);
const rateLimitBuckets = new Map();

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);

  lines.forEach((line) => {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return;
    }

    const separatorIndex = trimmedLine.indexOf('=');

    if (separatorIndex === -1) {
      return;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim();

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

const receiptSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    storeName: { type: 'string' },
    totalText: { type: 'string' },
    dateText: { type: 'string' },
    categoryKey: {
      type: 'string',
      enum: ['grocery', 'food', 'transport', 'fuel', 'home', 'clothing', 'health', 'other'],
    },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          category: {
            type: 'string',
            enum: ['grocery', 'food', 'transport', 'fuel', 'home', 'clothing', 'health', 'other'],
          },
          amount: {
            type: 'number',
            description: 'Exact item price as printed on the receipt. Do not round cents.',
          },
          quantity: { type: 'number' },
          unit: { type: 'string' },
        },
        required: ['name', 'category', 'amount', 'quantity', 'unit'],
      },
    },
  },
  required: ['storeName', 'totalText', 'dateText', 'categoryKey', 'confidence', 'items'],
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Client-Token',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Content-Type': 'application/json',
  });
  response.end(JSON.stringify(payload));
}

function getClientIp(request) {
  const forwardedFor = request.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  return request.socket.remoteAddress || 'unknown';
}

function isRateLimited(request) {
  const now = Date.now();
  const clientIp = getClientIp(request);
  const bucket = rateLimitBuckets.get(clientIp);

  if (!bucket || now - bucket.startedAt > RATE_LIMIT_WINDOW_MS) {
    rateLimitBuckets.set(clientIp, { count: 1, startedAt: now });
    return false;
  }

  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX_REQUESTS;
}

function isClientAuthorized(request) {
  if (!ANALYSIS_CLIENT_TOKEN) {
    return true;
  }

  return request.headers['x-client-token'] === ANALYSIS_CLIENT_TOKEN;
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    let bodyBytes = 0;

    request.on('data', (chunk) => {
      bodyBytes += chunk.length;

      if (bodyBytes > MAX_BODY_BYTES) {
        reject(new Error('REQUEST_TOO_LARGE'));
        request.destroy();
        return;
      }

      body += chunk.toString('utf8');
    });

    request.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (error) {
        reject(new Error('INVALID_JSON'));
      }
    });

    request.on('error', reject);
  });
}

function extractResponseText(openaiResponse) {
  if (typeof openaiResponse.output_text === 'string') {
    return openaiResponse.output_text;
  }

  const content = openaiResponse.output
    ?.flatMap((item) => item.content || [])
    ?.find((item) => item.type === 'output_text' || item.type === 'text');

  return content?.text || '';
}

function normalizeAnalysis(result) {
  return {
    storeName: String(result.storeName || '').trim(),
    totalText: String(result.totalText || '').trim(),
    dateText: String(result.dateText || '').trim(),
    categoryKey: result.categoryKey || 'other',
    confidence: typeof result.confidence === 'number' ? result.confidence : 0,
    items: Array.isArray(result.items)
      ? result.items
          .map((item) => ({
            name: String(item.name || '').trim(),
            category: item.category || 'other',
            amount: Number(item.amount) || 0,
            quantity: Number(item.quantity) || 1,
            unit: String(item.unit || '').trim(),
          }))
          .filter((item) => item.name || item.amount > 0)
      : [],
  };
}

async function analyzeReceipt(imageBase64) {
  if (!OPENAI_API_KEY) {
    const error = new Error('OPENAI_API_KEY is missing.');
    error.code = 'OPENAI_API_KEY_MISSING';
    throw error;
  }

  const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text:
                'Read this receipt/invoice image. Return only structured JSON. ' +
                'Use dateText as DD.MM.YYYY when possible. totalText must be the final paid total. ' +
                'Never round prices. Preserve cents exactly: 0.99 must be 0.99, 25.60 must be 25.60, and 55.84 must be 55.84. ' +
                'For item amount, return the exact line price printed on the receipt, not an estimated or rounded value. ' +
                'For each item, also return quantity and unit. If the receipt shows "2 x", quantity is 2 and unit is "pcs". If it shows weight like "2.395 kg", quantity is 2.395 and unit is "kg". If quantity is unclear, use quantity 1 and unit "". ' +
                'Classify each item and the whole receipt into one of: grocery, food, transport, fuel, home, clothing, health, other. Use fuel for gasoline, diesel, LPG, charging, gas stations, and fuel purchases. ' +
                'If a field is unclear, use an empty string or confidence below 0.75.',
            },
            {
              type: 'input_image',
              image_url: `data:image/jpeg;base64,${imageBase64}`,
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'receipt_analysis',
          strict: true,
          schema: receiptSchema,
        },
      },
    }),
  });

  const responseBody = await openaiResponse.json();

  if (!openaiResponse.ok) {
    const message = responseBody.error?.message || `OpenAI request failed: ${openaiResponse.status}`;
    const error = new Error(message);
    error.code = 'OPENAI_REQUEST_FAILED';
    error.status = openaiResponse.status;
    throw error;
  }

  const responseText = extractResponseText(responseBody);
  return normalizeAnalysis(JSON.parse(responseText));
}

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {});
    return;
  }

  if (request.method === 'GET' && request.url === '/') {
    sendJson(response, 200, { ok: true, service: 'nereye-receipt-analysis' });
    return;
  }

  if (request.method === 'GET' && request.url === '/health') {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method !== 'POST' || request.url !== '/analyze-receipt') {
    sendJson(response, 404, { error: 'NOT_FOUND' });
    return;
  }

  if (!isClientAuthorized(request)) {
    sendJson(response, 401, { error: 'UNAUTHORIZED' });
    return;
  }

  if (isRateLimited(request)) {
    sendJson(response, 429, { error: 'RATE_LIMITED', message: 'Too many analysis requests.' });
    return;
  }

  try {
    const body = await readJsonBody(request);

    if (!body.imageBase64 || typeof body.imageBase64 !== 'string') {
      sendJson(response, 400, { error: 'IMAGE_REQUIRED' });
      return;
    }

    const analysis = await analyzeReceipt(body.imageBase64);
    sendJson(response, 200, analysis);
  } catch (error) {
    const statusCode =
      error.message === 'REQUEST_TOO_LARGE' ? 413 : error.message === 'INVALID_JSON' ? 400 : 500;

    sendJson(response, statusCode, {
      error: error.code || error.message || 'ANALYSIS_FAILED',
      message: error.message || 'Receipt analysis failed.',
    });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Receipt analysis server running on http://localhost:${PORT}`);
  console.log('Endpoint: POST /analyze-receipt');
});
