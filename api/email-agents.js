const { callGeminiJSON } = require('./_lib/gemini');
const { runEmailCouncil } = require('./_lib/email-agents');

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];

const MAX_EMAIL_LENGTH = 12000;
const MAX_BACKGROUND_LENGTH = 3000;
const MAX_GOAL_LENGTH = 500;
// Each run fans out to ~8 model calls, so the per-IP limit is tighter than /api/generate.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
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
  return record.count > RATE_LIMIT_MAX;
}

function optionalString(value, max, name) {
  if (value === undefined || value === null || value === '') {
    return { value: '' };
  }
  if (typeof value !== 'string') {
    return { error: `${name} must be a string` };
  }
  if (value.length > max) {
    return { error: `${name} exceeds maximum length of ${max}` };
  }
  return { value: value.trim() };
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
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';

  if (rateLimit(clientIp)) {
    return res.status(429).json({ error: 'Too many requests. Please slow down.', status: 429 });
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not configured');
    return res.status(500).json({ error: 'Server configuration error', status: 500 });
  }

  const body = req.body || {};
  const { email } = body;
  if (!email || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ error: 'email is required and must be a string', status: 400 });
  }
  if (email.length > MAX_EMAIL_LENGTH) {
    return res
      .status(400)
      .json({ error: `email exceeds maximum length of ${MAX_EMAIL_LENGTH}`, status: 400 });
  }

  const background = optionalString(body.background, MAX_BACKGROUND_LENGTH, 'background');
  const goal = optionalString(body.goal, MAX_GOAL_LENGTH, 'goal');
  const invalid = background.error || goal.error;
  if (invalid) {
    return res.status(400).json({ error: invalid, status: 400 });
  }

  try {
    const result = await runEmailCouncil(
      { email: email.trim(), background: background.value, goal: goal.value },
      callGeminiJSON,
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error('Email agents error:', error.message);
    return res.status(502).json({ error: 'The agent team could not complete', status: 502 });
  }
};
