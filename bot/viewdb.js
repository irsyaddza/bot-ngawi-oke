// viewdb.js - SQLite Chat History Viewer
// Run: node viewdb.js

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'data/chat_history.db');

console.log('=== SQLite Chat History Viewer ===\n');
console.log('Database:', DB_PATH);

// Check if file exists
if (!fs.existsSync(DB_PATH)) {
    console.log('\n❌ Database file belum ada!');
    console.log('💡 Chat dulu sama bot biar database terbuat.');
    process.exit(0);
}

try {
    const db = new Database(DB_PATH, { readonly: true });

    // Get all records
    const stmt = db.prepare('SELECT * FROM chat_history ORDER BY updated_at DESC');
    const rows = stmt.all();

    console.log(`\n--- Data Chat History (${rows.length} records) ---\n`);

    if (rows.length === 0) {
        console.log('Belum ada data chat. Chat dulu sama bot!');
    } else {
        rows.forEach((row, i) => {
            console.log(`[${i + 1}] Key: ${row.history_key}`);
            console.log(`    Updated: ${new Date(row.updated_at).toLocaleString()}`);

            try {
                const messages = JSON.parse(row.messages);
                console.log(`    Messages: ${messages.length} total`);

                // Show last 2 messages
                const last = messages.slice(-2);
                last.forEach(msg => {
                    const text = msg.parts?.[0]?.text?.substring(0, 60) || '(no text)';
                    console.log(`      [${msg.role}]: ${text}...`);
                });
            } catch (e) {
                console.log(`    Messages: (parse error)`);
            }
            console.log('');
        });
    }

    db.close();
} catch (e) {
    console.error('Error:', e.message);
}
