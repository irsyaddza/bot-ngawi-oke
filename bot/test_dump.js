const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.OPENROUTER_API_KEY;
const payload = JSON.parse(fs.readFileSync('payload_test.json', 'utf-8'));

async function testGrok() {
    console.log("Testing Grok 4.3 with DB payload...");
    
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
