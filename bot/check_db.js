const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/chat_history.db');
const db = new Database(DB_PATH);

const rows = db.prepare('SELECT history_key, messages FROM chat_history').all();
console.log(`Found ${rows.length} records.`);

for (const row of rows) {
    const msgs = JSON.parse(row.messages);
    console.log(`Key: ${row.history_key}, length: ${msgs.length}`);
    for (let i = 2; i < msgs.length; i++) {
        const msg = msgs[i];
        if (!msg.parts || !msg.parts[0] || typeof msg.parts[0].text !== 'string') {
            console.log("MALFORMED:", JSON.stringify(msg));
        }
    }
}
