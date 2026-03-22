module.exports = async function handler(req, res) {
  const API_KEY = process.env.GEMINI_API_KEY;
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { model, promptText } = req.body;
    
    if (!promptText) {
        return res.status(400).json({ error: 'promptText is required' });
    }

    const selectedModel = model || 'models/gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/${selectedModel}:generateContent?key=${API_KEY}`;
    
    const payload = { 
        contents: [{ parts: [{ text: promptText }] }], 
        generationConfig: { temperature: 0.8 } 
    };

    const response = await fetch(url, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to generate content' });
  }
};
