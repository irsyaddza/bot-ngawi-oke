import { NextResponse } from 'next/server';
import archiver from 'archiver';
import fs from 'fs';
import { getDatabasePaths } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    // 1. Verify Auth
    const session = await getServerSession(authOptions);
    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    // 2. Get DB Paths
    const { analytics, weather, chat_history } = getDatabasePaths();

    // 3. Create Archive
    const archive = archiver('zip', {
        zlib: { level: 9 } // Best compression
    });

    // 4. Stream response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    archive.on('data', (chunk) => writer.write(chunk));
    archive.on('end', () => writer.close());
    archive.on('error', (err) => {
        console.error('[Backup] Archive error:', err);
        writer.abort(err);
    });

    // 5. Append files safely
    if (fs.existsSync(analytics)) {
        archive.file(analytics, { name: 'analytics.db' });
        // Also try to grab WAL files if they exist (important for active DBs)
        if (fs.existsSync(analytics + '-wal')) archive.file(analytics + '-wal', { name: 'analytics.db-wal' });
        if (fs.existsSync(analytics + '-shm')) archive.file(analytics + '-shm', { name: 'analytics.db-shm' });
    }

    if (fs.existsSync(weather)) {
        archive.file(weather, { name: 'weather.db' });
        if (fs.existsSync(weather + '-wal')) archive.file(weather + '-wal', { name: 'weather.db-wal' });
        if (fs.existsSync(weather + '-shm')) archive.file(weather + '-shm', { name: 'weather.db-shm' });
    }

    if (fs.existsSync(chat_history)) {
        archive.file(chat_history, { name: 'chat_history.db' });
        if (fs.existsSync(chat_history + '-wal')) archive.file(chat_history + '-wal', { name: 'chat_history.db-wal' });
        if (fs.existsSync(chat_history + '-shm')) archive.file(chat_history + '-shm', { name: 'chat_history.db-shm' });
    }

    archive.finalize();

    return new NextResponse(stream.readable, {
        headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="rusdi-backup-${new Date().toISOString().split('T')[0]}.zip"`
        }
    });
}
