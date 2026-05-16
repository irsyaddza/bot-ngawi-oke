const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/chat_history.db');
const db = new Database(DB_PATH);

const rows = db.prepare('SELECT history_key, messages FROM chat_history').all();
const row = rows.find(r => r.history_key === '847052421133238282'); // The one with 6776 length

const history = JSON.parse(row.messages);
const messages = [];
messages.push({
    role: 'system',
    content: 'system prompt'
});

for (let i = 2; i < history.length; i++) {
    const msg = history[i];
    messages.push({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.parts[0].text
    });
}
messages.push({ role: 'user', content: 'test prompt' });

const payload = {
    model: 'x-ai/grok-4.3',
    messages: messages,
    max_tokens: 500
};

const jsonStr = JSON.stringify(payload);
const fs = require('fs');
fs.writeFileSync('payload_test.json', jsonStr);
console.log("Wrote payload to payload_test.json");
