import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const filename = searchParams.get('filename');

        if (!filename) {
            console.error('[SoundStream] Missing filename parameter');
            return NextResponse.json({ error: 'filename required' }, { status: 400 });
        }

        // Security: Prevent directory traversal
        if (filename.includes('..') || filename.startsWith('/')) {
            console.error('[SoundStream] Invalid filename:', filename);
            return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
        }

        // Path to bot's assets folder
        const assetsPath = path.join(process.cwd(), '../bot/src/assets', filename);
        console.log('[SoundStream] Attempting to stream:', assetsPath);

        // Verify file exists
        if (!fs.existsSync(assetsPath)) {
            console.error('[SoundStream] File not found:', assetsPath);
            
            // List available files for debugging
            const assetsDir = path.join(process.cwd(), '../bot/src/assets');
            if (fs.existsSync(assetsDir)) {
                const files = fs.readdirSync(assetsDir);
                console.log('[SoundStream] Available files:', files);
            }
            
            return NextResponse.json({ error: 'Sound not found', requested: filename }, { status: 404 });
        }

        // Get file stats
        const stats = fs.statSync(assetsPath);
        console.log(`[SoundStream] File found: ${filename} (${stats.size} bytes)`);

        // Read file
        const fileBuffer = fs.readFileSync(assetsPath);
        
        // Determine MIME type based on file extension
        const ext = path.extname(filename).toLowerCase();
        let mimeType = 'audio/mpeg'; // default for mp3
        if (ext === '.wav') mimeType = 'audio/wav';
        else if (ext === '.ogg') mimeType = 'audio/ogg';

        console.log(`[SoundStream] Streaming: ${filename} as ${mimeType}`);

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': mimeType,
                'Content-Length': fileBuffer.length.toString(),
                'Cache-Control': 'public, max-age=3600',
                'Accept-Ranges': 'bytes'
            }
        });

    } catch (error) {
        console.error('[SoundStream] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
    }
}
