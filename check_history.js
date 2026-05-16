const { loadHistory } = require('./bot/src/utils/chatHistoryDB');
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data/chat_history.db');
const db = new Database(DB_PATH);

const rows = db.prepare('SELECT history_key, messages FROM chat_history').all();
console.log(`Found ${rows.length} history records.`);

for (const row of rows) {
    const msgs = JSON.parse(row.messages);
    console.log(`\nKey: ${row.history_key}, length: ${msgs.length}`);
    for (let i = 2; i < msgs.length; i++) {
        const msg = msgs[i];
        if (!msg.parts || !msg.parts[0] || typeof msg.parts[0].text !== 'string') {
            console.log("MALFORMED MSG:", JSON.stringify(msg));
        }
    }
    
    // Test mapping
    const openRouterMessages = [];
    openRouterMessages.push({ role: 'system', content: 'system prompt' });
    for (let i = 2; i < msgs.length; i++) {
        const msg = msgs[i];
        openRouterMessages.push({
            role: msg.role === 'model' ? 'assistant' : 'user',
            content: msg.parts[0].text
        });
    }
    
    console.log("Last 2 mapped messages:", JSON.stringify(openRouterMessages.slice(-2)));
}
