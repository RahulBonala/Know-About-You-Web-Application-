const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [];

const MAX_PROMPT_LENGTH = 8000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 15;
const ipRequestMap = new Map();

function isOriginAllowed(origin) {
  if (ALLOWED_ORIGINS.length === 0) {
    return true;
  }
  return ALLOWED_ORIGINS.includes(origin);
}

function rateLimit(ip) {
  const now = Date.now();
  const record = ipRequestMap.get(ip);

  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    ipRequestMap.set(ip, { windowStart: now, count: 1 });
    return false;
  }

  record.count += 1;
  if (record.count > RATE_LIMIT_MAX) {
    return true;
  }
  return false;
}

module.exports = async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (!isOriginAllowed(origin)) {
    return res.status(403).json({ error: 'Forbidden', status: 403 });
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed', status: 405 });
  }

  const clientIp =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  if (rateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Please slow down.', status: 429 });
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    console.error('GEMINI_API_KEY is not configured');
    return res.status(500).json({ error: 'Server configuration error', status: 500 });
  }

  try {
    const { model, promptText } = req.body;

    if (!promptText || typeof promptText !== 'string') {
      return res.status(400).json({ error: 'promptText is required and must be a string', status: 400 });
    }

    if (promptText.length > MAX_PROMPT_LENGTH) {
      return res.status(400).json({ error: `promptText exceeds maximum length of ${MAX_PROMPT_LENGTH}`, status: 400 });
    }

    const fallbackModels = ['models/gemini-2.0-flash', 'models/gemini-2.0-flash-lite'];
    if (model && typeof model === 'string' && model.startsWith('models/')) {
      fallbackModels.unshift(model);
    }
    const uniqueModels = [...new Set(fallbackModels)];

    const payload = {
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: { temperature: 0.8 },
    };

    for (let i = 0; i < uniqueModels.length; i++) {
      const currentModel = uniqueModels[i];
      const url = `https://generativelanguage.googleapis.com/v1beta/${currentModel}:generateContent?key=${API_KEY}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        return res.status(200).json(data);
      }

      if (i < uniqueModels.length - 1) {
        console.warn(`Model ${currentModel} returned ${response.status}, trying next fallback`);
        continue;
      }

      return res.status(response.status).json({
        error: `AI model unavailable (${response.status})`,
        status: response.status,
      });
    }
  } catch (error) {
    console.error('Generate endpoint error:', error.message);
    return res.status(500).json({ error: 'Failed to generate content', status: 500 });
  }
};
