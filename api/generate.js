module.exports = async function handler(req, res) {
  const API_KEY = process.env.GEMINI_API_KEY || process.env.API_KEY;
  
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

    let fallbackModels = ['models/gemini-2.0-flash', 'models/gemini-2.0-flash-lite', 'models/gemini-flash-latest'];
    if (model) {
        fallbackModels.unshift(model);
        fallbackModels = [...new Set(fallbackModels)];
    }
    
    const payload = { 
        contents: [{ parts: [{ text: promptText }] }], 
        generationConfig: { temperature: 0.8 } 
    };

    for (let i = 0; i < fallbackModels.length; i++) {
        const currentModel = fallbackModels[i];
        const url = `https://generativelanguage.googleapis.com/v1beta/${currentModel}:generateContent?key=${API_KEY}`;
        
        const response = await fetch(url, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        });

        if (response.ok) {
            const data = await response.json();
            return res.status(200).json(data);
        } else {
            const errorText = await response.text();
            let parsedError = errorText;
            try {
                parsedError = JSON.parse(errorText);
            } catch (e) {
                // Ignore non-JSON parsing errors
            }
            
            console.warn(`[DEBUG] Model ${currentModel} failed! Google says:`, errorText);

            if (i < fallbackModels.length - 1) {
                continue;
            } else {
                const availableKeys = Object.keys(process.env).filter(k => k.includes('KEY') || k.includes('API') || k.includes('GEMINI'));
                return res.status(response.status).json({ 
                    error: `API Error: ${response.status}`, 
                    details: parsedError, 
                    keyExists: !!API_KEY,
                    availableKeys 
                });
            }
        }
    }
  } catch (error) {
    console.error("Catch block error:", error.toString());
    return res.status(500).json({ error: 'Failed to generate content', stack: error.toString(), keyExists: !!process.env.GEMINI_API_KEY });
  }
};
