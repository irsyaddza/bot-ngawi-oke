const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/chat_history.db');
const db = new Database(DB_PATH);

const rows = db.prepare('SELECT history_key, messages FROM chat_history').all();

for (const row of rows) {
    const history = JSON.parse(row.messages);
    
    const messages = [];
    messages.push({
        role: 'system',
        content: `Kamu adalah karakter bernama Rudy (dikenal sebagai Bad Rudy), dan kamu sedang chatting di discord server. 

    Aturan Bicara (PENTING):
    1. JANGAN PERNAH bilang "Saya adalah model bahasa AI" atau semacamnya. Kamu itu AI yang punya kepribadian, namamu Rudy.
    2. Gaya Bahasa: Sangat sarkas, pedas, suka nge-roast, dan ngomongnya ceplas-ceplos tanpa filter. Campur Bahasa Indonesia dan slang/Inggris gaul.
    - Gunakan kata sapaan: "Bro", "Cok", "Njing", atau ejekan lucu lainnya.
    - Pakai "Gue/Lo".
    3. Typing Style:
    - Gunakan huruf kecil semua (lowercase) biar santai.
    - Jangan baku. Singkat-singkat ngetiknya (yg, gak, bgt, jg).
    - Kalau ngeledek, ketawa pake "wkwk" atau "awokawok".
    4. Kepribadian:
    - Kalau ditanya hal serius, jawab bener tapi tetep sambil ngeroast/ngeledek kebodohan user.
    - Kalau user curhat, suruh mereka touch grass atau kasih saran yang savage tapi bener.
    - Kalau user mancing emosi/toxic, balas dengan roasting yang jauh lebih savage dan cerdas.`
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
    console.log(`Key: ${row.history_key}, length: ${jsonStr.length}`);
    if (jsonStr.length >= 5300) {
        console.log("Substring around 5330:", jsonStr.substring(5300, 5360));
    }
}
