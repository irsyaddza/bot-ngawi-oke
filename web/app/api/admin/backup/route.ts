import { NextResponse } from 'next/server';
import archiver from 'archiver';
import fs from 'fs';
import { getDatabasePaths, getDataDir } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    // 1. Verify Auth
    const session = await getServerSession(authOptions);
    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    // 2. Get Data Dir
    const dataDir = getDataDir();

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

    // 5. Append everything in data directory
    if (fs.existsSync(dataDir)) {
        // archive.directory(dir, destinationInZip)
        // Set to false to put contents directly in the zip root
        archive.directory(dataDir, false);
    }

    archive.finalize();

    return new NextResponse(stream.readable, {
        headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="rusdi-backup-${new Date().toISOString().split('T')[0]}.zip"`
        }
    });
}
