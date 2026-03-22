require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from current directory
app.use(express.static('.'));

// Proxy endpoint for Gemini models
app.get('/api/models', async (req, res) => {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch models' });
    }
});

// Proxy endpoint for generating content
app.post('/api/generate', async (req, res) => {
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
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate content' });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
    console.log(`Open http://localhost:${port} to view the app`);
});
