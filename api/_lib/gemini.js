// Shared Gemini client for agent pipelines. Files under api/_lib are not exposed as routes.

const DEFAULT_MODELS = [
  'models/gemini-2.5-flash',
  'models/gemini-2.5-flash-lite',
  'models/gemini-2.0-flash',
  'models/gemini-2.0-flash-lite',
];

function parseJsonLoose(text) {
  try {
    return JSON.parse(text);
  } catch {
    // Models occasionally wrap JSON in fences or prose; pull out the outermost object.
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error('Model did not return valid JSON');
  }
}

/**
 * Calls Gemini with a system instruction and user prompt, expecting a JSON object back.
 * Walks the fallback model list on HTTP failure.
 */
async function callGeminiJSON({ system, prompt, temperature = 0.4, models = DEFAULT_MODELS }) {
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const payload = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature, responseMimeType: 'application/json' },
  };

  let lastError;
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${API_KEY}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        lastError = new Error(`${model} returned ${response.status}`);
        console.error(`${model} returned ${response.status}:`, errBody.slice(0, 300));
        continue;
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
      if (!text) {
        lastError = new Error(`${model} returned an empty response`);
        continue;
      }
      return parseJsonLoose(text);
    } catch (error) {
      lastError = error;
      console.error(`${model} call failed:`, error.message);
    }
  }
  throw lastError || new Error('All Gemini models failed');
}

module.exports = { callGeminiJSON, parseJsonLoose };
