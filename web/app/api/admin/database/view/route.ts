import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

// Helper to determine DB path
const getDataDir = () => process.env.DATABASE_PATH || path.join(process.cwd(), '../data');

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const dbName = searchParams.get('db');
        const tableName = searchParams.get('table');

        if (!dbName) {
            return NextResponse.json({ error: 'Database name required' }, { status: 400 });
        }

        const dataDir = getDataDir();
        let dbPath = '';

        // Safe-guard against directory traversal and limit to specific DBs
        switch (dbName) {
            case 'chat_history':
                dbPath = path.join(dataDir, 'chat_history.db');
                break;
            case 'weather':
                dbPath = path.join(dataDir, 'weather.db');
                break;
            case 'analytics':
                dbPath = path.join(dataDir, 'analytics.db');
                break;
            default:
                return NextResponse.json({ error: 'Invalid database name' }, { status: 400 });
        }

        if (!fs.existsSync(dbPath)) {
            return NextResponse.json({ error: 'Database file not found', path: dbPath }, { status: 404 });
        }

        // Open DB in Read-Only mode
        const db = new Database(dbPath, { readonly: true });

        try {
            let data: any[] = [];
            let columns: string[] = [];

            if (dbName === 'chat_history') {
                console.log(`[DEBUG] Reading Chat History from: ${dbPath}`);
                if (fs.existsSync(dbPath)) {
                    const stats = fs.statSync(dbPath);
                    console.log(`[DEBUG] File Size: ${stats.size} bytes`);
                }

                const stmt = db.prepare('SELECT history_key, messages, updated_at FROM chat_history ORDER BY updated_at DESC LIMIT 50');
                data = stmt.all();
                console.log(`[DEBUG] Chat History Rows Found: ${data.length}`);
                columns = ['history_key', 'messages', 'updated_at'];
            } else if (dbName === 'weather') {
                const stmt = db.prepare('SELECT * FROM weather_config');
                data = stmt.all();
                if (data.length > 0) columns = Object.keys(data[0]);
            } else if (dbName === 'analytics') {
                // Analytics has multiple tables, require specific table or default to messages
                const validTables = ['analytics_messages', 'analytics_voice', 'analytics_config', 'analytics_voice_active'];
                const targetTable = validTables.includes(tableName || '') ? tableName : 'analytics_messages';

                // Limit columns for messages to avoid huge text dumps if any (though analytics usually has IDs)
                const orderBy = targetTable === 'analytics_config' ? 'guild_id' : 'id';
                const stmt = db.prepare(`SELECT * FROM ${targetTable} ORDER BY ${orderBy} DESC LIMIT 50`);
                data = stmt.all();
                if (data.length > 0) columns = Object.keys(data[0]);
            }

            return NextResponse.json({ data, columns });
        } finally {
            db.close();
        }

    } catch (error) {
        console.error('Database view error:', error);
        return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
    }
}
