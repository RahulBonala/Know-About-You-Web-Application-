module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed', status: 405 });
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    console.error('GEMINI_API_KEY is not configured');
    return res.status(500).json({ error: 'Server configuration error', status: 500 });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`,
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed to fetch models (${response.status})`,
        status: response.status,
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Models endpoint error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch models', status: 500 });
  }
};
