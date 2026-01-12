import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

// Helper to determine DB path
const getDataDir = () => process.env.DATABASE_PATH || path.join(process.cwd(), '../data');

const DB_CONFIG = {
    'chat_history': {
        file: 'chat_history.db',
        pk: 'history_key',
        tables: ['chat_history']
    },
    'weather': {
        file: 'weather.db',
        pk: 'guild_id',
        tables: ['weather_config']
    },
    'analytics': {
        file: 'analytics.db',
        pk: 'id', // Default, override per table below
        tables: ['analytics_messages', 'analytics_voice', 'analytics_voice_active', 'analytics_config']
    }
};

const TABLE_PK = {
    'weather_config': 'guild_id',
    'analytics_config': 'guild_id',
    'chat_history': 'history_key',
    'analytics_messages': 'id',
    'analytics_voice': 'id',
    'analytics_voice_active': 'id'
};

const getDbPath = (dbName: string) => {
    const config = DB_CONFIG[dbName as keyof typeof DB_CONFIG];
    if (!config) return null;
    return path.join(getDataDir(), config.file);
};

export async function POST(request: Request) {
    return handleRequest(request, 'create');
}

export async function PUT(request: Request) {
    return handleRequest(request, 'update');
}

export async function DELETE(request: Request) {
    return handleRequest(request, 'delete');
}

async function handleRequest(request: Request, action: 'create' | 'update' | 'delete') {
    try {
        const body = await request.json();
        const { db: dbName, table, data, key } = body;

        if (!dbName || !table) {
            return NextResponse.json({ error: 'Database and Table name required' }, { status: 400 });
        }

        const dbPath = getDbPath(dbName);
        if (!dbPath || !fs.existsSync(dbPath)) {
            return NextResponse.json({ error: 'Database not found' }, { status: 404 });
        }

        // --- DISABLE WAL MODE for Docker Compatibility ---
        const db = new Database(dbPath);
        try {
            db.pragma('journal_mode = DELETE');
        } catch (e) {
            console.error('Failed to set journal_mode', e);
        }

        try {
            const pkCol = TABLE_PK[table as keyof typeof TABLE_PK] || 'id';

            if (action === 'create') {
                const cols = Object.keys(data);
                const vals = Object.values(data);
                const placeholders = cols.map(() => '?').join(',');
                const stmt = db.prepare(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`);
                const info = stmt.run(...vals);
                return NextResponse.json({ success: true, changes: info.changes, lastInsertRowid: info.lastInsertRowid.toString() });

            } else if (action === 'update') {
                if (!key) return NextResponse.json({ error: 'Key required for update' }, { status: 400 });

                const cols = Object.keys(data);
                const vals = Object.values(data);
                const setClause = cols.map(c => `${c} = ?`).join(',');

                // Add key to end of vals for WHERE clause
                const stmt = db.prepare(`UPDATE ${table} SET ${setClause} WHERE ${pkCol} = ?`);
                const info = stmt.run(...vals, key);
                return NextResponse.json({ success: true, changes: info.changes });

            } else if (action === 'delete') {
                if (!key) return NextResponse.json({ error: 'Key required for delete' }, { status: 400 });

                const stmt = db.prepare(`DELETE FROM ${table} WHERE ${pkCol} = ?`);
                const info = stmt.run(key);
                return NextResponse.json({ success: true, changes: info.changes });
            }

        } finally {
            db.close();
        }

    } catch (error: any) {
        console.error('CRUD Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
