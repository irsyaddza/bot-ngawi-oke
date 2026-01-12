import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: any = null;

// Default Settings
const DEFAULTS: Record<string, string> = {
    'maintenance_mode': '0', // 0 = off, 1 = on
    'ai_logic': 'gemini',    // gemini or deepseek
    'music_volume': '100'
};

export function initSettingsDB() {
    if (db) return db;

    // In Docker, both bot and web map ./data to /app/data
    // Web might be running in /app (WORKDIR), so ../data might be wrong if /app/data is the mount.
    // Dockerfile says WORKDIR /app. Volume is /app/data. So valid path is /app/data/settings.db
    // Local dev: process.cwd() is web root. Data is likely ../data.

    // We can rely on process.env.DATABASE_PATH having priority.

    const dbPathEnv = process.env.DATABASE_PATH;

    let dbFilePath = '';

    if (dbPathEnv) {
        dbFilePath = path.join(dbPathEnv, 'settings.db');
        if (!fs.existsSync(dbPathEnv)) {
            // Should exist from docker mount, but just in case
            try { fs.mkdirSync(dbPathEnv, { recursive: true }); } catch (e) { }
        }
    } else {
        // Fallback for local dev (assuming running from web/)
        const localDataDir = path.join(process.cwd(), '../data');
        dbFilePath = path.join(localDataDir, 'settings.db');
        if (!fs.existsSync(localDataDir)) {
            try { fs.mkdirSync(localDataDir, { recursive: true }); } catch (e) { }
        }
    }

    db = new Database(dbFilePath);

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
export function getSetting(key: string): string {
    const database = initSettingsDB();
    const row = database.prepare('SELECT value FROM global_settings WHERE key = ?').get(key) as { value: string } | undefined;
    return row ? row.value : (DEFAULTS[key] || '');
}

/**
 * Set a setting value
 */
export function setSetting(key: string, value: string | number) {
    const database = initSettingsDB();
    database.prepare(`
        INSERT OR REPLACE INTO global_settings (key, value) VALUES (?, ?)
    `).run(key, String(value));
}

/**
 * Get all settings as an object
 */
export function getAllSettings(): Record<string, string> {
    const database = initSettingsDB();
    const rows = database.prepare('SELECT key, value FROM global_settings').all() as { key: string, value: string }[];
    const settings = { ...DEFAULTS };
    for (const row of rows) {
        settings[row.key] = row.value;
    }
    return settings;
}

/**
 * Check if user is an admin (in DB)
 */
export function isAdminInDB(userId: string): boolean {
    const database = initSettingsDB();
    const row = database.prepare('SELECT user_id FROM admin_users WHERE user_id = ?').get(userId);
    return !!row;
}

/**
 * Get all admins
 */
export function getAdmins(): any[] {
    const database = initSettingsDB();
    return database.prepare('SELECT * FROM admin_users ORDER BY added_at DESC').all();
}

/**
 * Add a new admin
 */
export function addAdmin(userId: string, name: string = 'Unknown', addedBy: string = 'System'): boolean {
    const database = initSettingsDB();
    try {
        database.prepare(`
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
export function removeAdmin(userId: string) {
    const database = initSettingsDB();
    database.prepare('DELETE FROM admin_users WHERE user_id = ?').run(userId);
}
