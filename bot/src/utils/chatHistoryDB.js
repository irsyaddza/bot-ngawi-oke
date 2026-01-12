// Chat History Database using SQLite
// Persistent storage for AI chat conversations

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../data/chat_history.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database (synchronous with better-sqlite3)
let db = null;

function initDB() {
    if (db) return db;

    try {
        db = new Database(DB_PATH);

        // Create table if not exists
        db.exec(`
            CREATE TABLE IF NOT EXISTS chat_history (
                history_key TEXT PRIMARY KEY,
                messages TEXT NOT NULL,
                updated_at INTEGER NOT NULL
            )
        `);

        console.log('[ChatDB] SQLite initialized successfully');
        return db;
    } catch (error) {
        console.error('[ChatDB] Failed to initialize:', error);
        return null;
    }
}

/**
 * Save chat history for a user-channel combination
 * @param {string} historyKey - Format: `userId-channelId`
 * @param {Array} messages - Array of chat messages
 */
function saveHistory(historyKey, messages) {
    try {
        initDB();
        if (!db) return false;

        const messagesJson = JSON.stringify(messages);
        const now = Date.now();

        // Upsert: Insert or Replace
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO chat_history (history_key, messages, updated_at)
            VALUES (?, ?, ?)
        `);

        stmt.run(historyKey, messagesJson, now);
        console.log(`[ChatDB] Saved ${historyKey}, ${messages.length} msgs`);
        return true;
    } catch (error) {
        console.error('[ChatDB] Save error:', error);
        return false;
    }
}

/**
 * Load chat history for a user-channel combination
 * @param {string} historyKey - Format: `userId-channelId`
 * @returns {Array|null} Array of messages or null if not found
 */
function loadHistory(historyKey) {
    try {
        initDB();
        if (!db) return null;

        const stmt = db.prepare('SELECT messages FROM chat_history WHERE history_key = ?');
        const row = stmt.get(historyKey);

        if (row && row.messages) {
            return JSON.parse(row.messages);
        }

        return null;
    } catch (error) {
        console.error('[ChatDB] Load error:', error);
        return null;
    }
}

/**
 * Clear chat history for a user-channel combination
 * @param {string} historyKey - Format: `userId-channelId`
 */
function clearHistory(historyKey) {
    try {
        initDB();
        if (!db) return false;

        const stmt = db.prepare('DELETE FROM chat_history WHERE history_key = ?');
        stmt.run(historyKey);
        return true;
    } catch (error) {
        console.error('[ChatDB] Clear error:', error);
        return false;
    }
}

/**
 * Clear ALL chat history (delete all rows)
 * @returns {number} Number of deleted rows
 */
function clearAllHistory() {
    try {
        initDB();
        if (!db) return 0;

        const stmt = db.prepare('DELETE FROM chat_history');
        const result = stmt.run();
        console.log(`[ChatDB] Cleared all history: ${result.changes} rows deleted`);
        return result.changes;
    } catch (error) {
        console.error('[ChatDB] ClearAll error:', error);
        return 0;
    }
}

/**
 * Get all history keys (for debugging/admin)
 * @returns {Array} List of all history entries
 */
function getAllKeys() {
    try {
        initDB();
        if (!db) return [];

        const stmt = db.prepare('SELECT history_key, updated_at FROM chat_history');
        return stmt.all();
    } catch (error) {
        console.error('[ChatDB] GetAllKeys error:', error);
        return [];
    }
}

module.exports = {
    initDB,
    saveHistory,
    loadHistory,
    clearHistory,
    clearAllHistory,
    getAllKeys
};
