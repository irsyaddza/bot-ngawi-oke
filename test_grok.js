const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const apiKey = process.env.OPENROUTER_API_KEY;

async function testGrok() {
    console.log("Testing Grok 4.3...");
    const payload = {
        model: 'x-ai/grok-4.3',
        messages: [
            { role: 'system', content: 'Kamu adalah karakter bernama Rudy.' },
            { role: 'user', content: 'Halo' }
        ],
        max_tokens: 500
    };
    
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.text();
        console.log("Status:", response.status);
        console.log("Response:", data);
    } catch (e) {
        console.error("Error:", e);
    }
}

testGrok();
