import { NextResponse } from 'next/server';
import { getAnalyticsDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import os from 'os';

export const dynamic = 'force-dynamic';

export async function GET() {
    // 1. Check Auth
    const session = await getServerSession(authOptions);
    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const db = getAnalyticsDb();

        const safeGet = (query: string, params: any[] = []): any => {
            try {
                return db.prepare(query).get(...params);
            } catch (e: any) {
                // Return null if table doesn't exist to handle gracefully
                // SQLite error code for no such table is usually roughly this or check message
                if (e.message && e.message.includes('no such table')) return null;
                throw e;
            }
        };

        // 2. Query Stats
        // Voice Time (Hours)
        const voiceStats = safeGet(`
            SELECT SUM(duration_seconds) as total_seconds 
            FROM analytics_voice
        `) as { total_seconds: number } | null;

        // Message Count
        const msgStats = safeGet(`
            SELECT COUNT(*) as count 
            FROM analytics_messages
        `) as { count: number } | null;

        // Active Users (Unique IDs from both tables in last 30 days)
        let activeUsersCount = 0;
        try {
            // We try a simple query first to see if tables exist before complex UNION
            const userStats = db.prepare(`
                SELECT COUNT(DISTINCT user_id) as count 
                FROM (
                    SELECT user_id FROM analytics_messages WHERE timestamp > datetime('now', '-30 days')
                    UNION 
                    SELECT user_id FROM analytics_voice WHERE join_time > datetime('now', '-30 days')
                )
            `).get() as { count: number };
            activeUsersCount = userStats?.count || 0;
        } catch (e) {
            // Ignore if tables missing
        }

        // 3. System Uptime & Resources
        const uptime = process.uptime();
        const memUsage = process.memoryUsage().rss; // Resident Set Size
        const cpus = os.cpus().length;
        const loadAvg = os.loadavg()[0];
        const cpuPercent = Math.min(Math.floor((loadAvg / cpus) * 100), 100); // Rough estimate

        // 4. Recent Activity Logs (Unified Timeline)
        let recentLogs: any[] = [];
        try {
            const logs = db.prepare(`
                SELECT user_id, type, detail, timestamp 
                FROM analytics_events 
                ORDER BY timestamp DESC 
                LIMIT 10
            `).all() as any[];

            recentLogs = logs.map(l => ({
                id: Math.random().toString(36).substr(2, 9),
                type: l.type, // 'message', 'voice', 'command'
                user: l.user_id,
                description: l.detail,
                time: l.timestamp
            }));
        } catch (e: any) {
            console.error('[Stats API] Recent Logs Error:', e.message);
            // Silent fallback if table doesn't exist yet
        }

        const data = {
            voiceHours: Math.round((voiceStats?.total_seconds || 0) / 3600),
            messageCount: msgStats?.count || 0,
            activeUsers: activeUsersCount,
            uptimeSeconds: uptime,
            system: {
                memory: memUsage,
                cpu: cpuPercent
            },
            recentLogs
        };
        console.log('[Stats API] Returning data:', data); // DEBUG

        return NextResponse.json(data);

    } catch (error) {
        console.error('[Stats API] Error:', error);
        // Return 0 values instead of 500 to keep UI alive
        return NextResponse.json({
            voiceHours: 0,
            messageCount: 0,
            activeUsers: 0,
            uptimeSeconds: os.uptime()
        });
    }
}
