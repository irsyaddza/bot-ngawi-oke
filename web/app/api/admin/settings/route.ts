import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Import from local helper
import {
    getAllSettings,
    getAdmins,
    setSetting,
    addAdmin,
    removeAdmin
} from '@/lib/settingsDB';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const settings = getAllSettings();
        const admins = getAdmins();
        return NextResponse.json({ settings, admins });
    } catch (error) {
        console.error('Settings API Error:', error);
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
        const { action, key, value, userId, name } = body;

        if (action === 'update_setting') {
            setSetting(key, value);
            return NextResponse.json({ success: true, settings: getAllSettings() });
        }

        if (action === 'add_admin') {
            addAdmin(userId, name, session.user?.name || 'Admin');
            return NextResponse.json({ success: true, admins: getAdmins() });
        }

        if (action === 'remove_admin') {
            removeAdmin(userId);
            return NextResponse.json({ success: true, admins: getAdmins() });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Settings Update Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
