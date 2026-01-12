import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database instances cache
let analyticsDb: Database.Database | null = null;
let weatherDb: Database.Database | null = null;

const getDataDir = () => {
    // Priority: 
    // Priority:
    // 1. Env Var (Docker/Manual Override)
    // 2. Project root data folder (Standard Monorepo)
    if (process.env.DATABASE_PATH) return process.env.DATABASE_PATH;

    // In monorepo 'web' folder, data is one level up
    const dir = path.join(process.cwd(), '../data');
    console.log('[WebDB] Resolved Data Dir:', dir); // DEBUG
    return dir;
};

export const getAnalyticsDb = () => {
    if (analyticsDb) return analyticsDb;

    const dbPath = path.join(getDataDir(), 'analytics.db');

    // Verify DB exists before connecting (to avoid creating empty files if path is wrong)
    if (!fs.existsSync(dbPath)) {
        console.warn(`[WebDB] Analytics DB not found at: ${dbPath}`);
        // In dev, we might accept it creating a new file, but usually we want to read the bot's DB
    }

    try {
        analyticsDb = new Database(dbPath, { readonly: true, fileMustExist: false });
        // Open in ReadOnly mode mostly for dashboard safety, 
        // but Config pages might need write access later.
        // For now, let's allow write but default to read operations in UI.
        analyticsDb.pragma('journal_mode = WAL');
        return analyticsDb;
    } catch (err) {
        console.error(`[WebDB] Failed to connect to Analytics DB:`, err);
        throw err;
    }
};

export const getWeatherDb = () => {
    if (weatherDb) return weatherDb;

    const dbPath = path.join(getDataDir(), 'weather.db');

    try {
        weatherDb = new Database(dbPath, { fileMustExist: false });
        weatherDb.pragma('journal_mode = WAL');
        return weatherDb;
    } catch (err) {
        console.error(`[WebDB] Failed to connect to Weather DB:`, err);
        throw err;
    }
};

// Helper for backup API
export const getDatabasePaths = () => {
    const dataDir = getDataDir();
    return {
        analytics: path.join(dataDir, 'analytics.db'),
        weather: path.join(dataDir, 'weather.db'),
        chat_history: path.join(dataDir, 'chat_history.db')
    };
};
