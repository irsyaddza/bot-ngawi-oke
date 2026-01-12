const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db = null;

// Default Settings
const DEFAULTS = {
    'maintenance_mode': '0', // 0 = off, 1 = on
    'ai_logic': 'gemini',    // gemini or deepseek
    'music_volume': '100'
};

function initSettingsDB() {
    if (db) return db;

    const dataDir = process.env.DATABASE_PATH || path.join(__dirname, '../../../data');
    const dbPath = path.join(dataDir, 'settings.db');

    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(dbPath);

    // Global Settings Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS global_settings (
            key TEXT PRIMARY KEY,
            value TEXT
        );
    `);

    // Admin Users Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS admin_users (
            user_id TEXT PRIMARY KEY,
            name TEXT,
            added_by TEXT,
            added_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    return db;
}

/**
 * Get a setting value, or default if not set
 */
function getSetting(key) {
    initSettingsDB();
    const row = db.prepare('SELECT value FROM global_settings WHERE key = ?').get(key);
    return row ? row.value : DEFAULTS[key];
}

/**
 * Set a setting value
 */
function setSetting(key, value) {
    initSettingsDB();
    db.prepare(`
        INSERT OR REPLACE INTO global_settings (key, value) VALUES (?, ?)
    `).run(key, String(value));
}

/**
 * Get all settings as an object
 */
function getAllSettings() {
    initSettingsDB();
    const rows = db.prepare('SELECT key, value FROM global_settings').all();
    const settings = { ...DEFAULTS };
    for (const row of rows) {
        settings[row.key] = row.value;
    }
    return settings;
}

/**
 * Check if user is an admin (in DB)
 */
function isAdmin(userId) {
    initSettingsDB();
    const row = db.prepare('SELECT user_id FROM admin_users WHERE user_id = ?').get(userId);
    return !!row;
}

/**
 * Get all admins
 */
function getAdmins() {
    initSettingsDB();
    return db.prepare('SELECT * FROM admin_users ORDER BY added_at DESC').all();
}

/**
 * Add a new admin
 */
function addAdmin(userId, name = 'Unknown', addedBy = 'System') {
    initSettingsDB();
    try {
        db.prepare(`
            INSERT INTO admin_users (user_id, name, added_by) VALUES (?, ?, ?)
        `).run(userId, name, addedBy);
        return true;
    } catch (e) {
        return false; // Likely duplicate
    }
}

/**
 * Remove an admin
 */
function removeAdmin(userId) {
    initSettingsDB();
    db.prepare('DELETE FROM admin_users WHERE user_id = ?').run(userId);
}

module.exports = {
    initSettingsDB,
    getSetting,
    setSetting,
    getAllSettings,
    isAdmin,
    getAdmins,
    addAdmin,
    removeAdmin
};
