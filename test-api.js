require('dotenv').config();
const generateHandler = require('./api/generate');

const req = {
    method: 'POST',
    body: {
        model: 'models/gemini-2.0-flash',
        promptText: 'Reply with just the word SUCCESS.'
    }
};

const res = {
    status: function(code) { this.statusCode = code; return this; },
    json: function(data) { console.log(`STATUS: ${this.statusCode}`); console.log(JSON.stringify(data, null, 2).substring(0, 300)); },
    end: function() {}
};

generateHandler(req, res);
