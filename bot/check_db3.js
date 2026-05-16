const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/chat_history.db');
const db = new Database(DB_PATH);

const rows = db.prepare('SELECT history_key, messages FROM chat_history').all();

for (const row of rows) {
    const history = JSON.parse(row.messages);
    for (let i = 2; i < history.length; i++) {
        const msg = history[i];
        if (msg.parts[0].text === undefined) {
            console.log(`Key ${row.history_key}: text is undefined at index ${i}`, msg);
        }
        if (msg.parts[0].text === null) {
            console.log(`Key ${row.history_key}: text is null at index ${i}`, msg);
        }
    }
}
console.log("Check complete.");
