import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
    getSounds,
    getSound,
    deleteSound,
    renameSound,
    updateDescription,
    recordPlayback,
    getDataDir
} from '@/lib/soundsDB';
import path from 'path';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const guildId = searchParams.get('guildId');

        if (!guildId) {
            return NextResponse.json({ error: 'guildId required' }, { status: 400 });
        }

        const sounds = getSounds(guildId);
        return NextResponse.json({ success: true, sounds });
    } catch (error) {
        console.error('Sounds API GET Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { guildId, soundId, action, name, description } = body;

        if (!guildId || !soundId) {
            return NextResponse.json(
                { error: 'guildId and soundId required' },
                { status: 400 }
            );
        }

        // Verify sound exists
        const sound = getSound(guildId, soundId);
        if (!sound) {
            return NextResponse.json({ error: 'Sound not found' }, { status: 404 });
        }

        let success = false;

        if (action === 'rename' && name) {
            success = renameSound(guildId, soundId, name);
        } else if (action === 'update_description' && description !== undefined) {
            success = updateDescription(guildId, soundId, description);
        } else if (action === 'record_playback') {
            success = recordPlayback(guildId, soundId);
        }

        if (success) {
            const updatedSound = getSound(guildId, soundId);
            return NextResponse.json({ success: true, sound: updatedSound });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Sounds API POST Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const guildId = searchParams.get('guildId');
        const soundId = searchParams.get('soundId');

        if (!guildId || !soundId) {
            return NextResponse.json(
                { error: 'guildId and soundId required' },
                { status: 400 }
            );
        }

        // Get asset path for file deletion
        const assetPath = path.join(process.cwd(), '../bot/src/assets');
        const success = deleteSound(guildId, soundId, assetPath);

        if (success) {
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Sound not found' }, { status: 404 });

    } catch (error) {
        console.error('Sounds API DELETE Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
