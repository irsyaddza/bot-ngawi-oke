import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

const getDataDir = () => process.env.DATABASE_PATH || path.join(process.cwd(), '../data');

export async function GET() {
    return handleStats();
}

async function handleStats() {
    try {
        const dbPath = path.join(getDataDir(), 'analytics.db');

        if (!fs.existsSync(dbPath)) {
            // Return dummy data if DB doesn't exist yet (fresh install)
            return NextResponse.json({
                daily: [],
                hourly: [],
                topUsers: [],
                totals: { messages: 0, voiceHours: 0 }
            });
        }

        const db = new Database(dbPath);
        // Disable WAL for safety
        try { db.pragma('journal_mode = DELETE'); } catch (e) { }

        try {
            // 1. Daily Activity (Last 7 Days)
            const dailyQuery = `
                SELECT 
                    DATE(timestamp) as date,
                    COUNT(*) as count
                FROM analytics_messages 
                WHERE timestamp >= datetime('now', '-6 days')
                GROUP BY DATE(timestamp)
                ORDER BY date ASC
            `;
            const dailyData = db.prepare(dailyQuery).all();

            // Fill missing days
            const filledDaily = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                const found = dailyData.find((r: any) => r.date === dateStr);
                filledDaily.push({
                    date: dateStr, // e.g., "2024-01-01"
                    day: d.toLocaleDateString('en-US', { weekday: 'short' }), // "Mon"
                    count: found ? (found as any).count : 0
                });
            }

            // 2. Hourly Activity (All time trend distribution)
            const hourlyQuery = `
                SELECT 
                    strftime('%H', timestamp) as hour,
                    COUNT(*) as count
                FROM analytics_messages
                GROUP BY hour
                ORDER BY hour ASC
            `;
            const hourlyRows = db.prepare(hourlyQuery).all();
            const hourlyData = Array.from({ length: 24 }, (_, i) => {
                const hStr = i.toString().padStart(2, '0');
                const found = hourlyRows.find((r: any) => r.hour === hStr);
                return {
                    hour: `${hStr}:00`,
                    count: found ? (found as any).count : 0
                };
            });

            // 3. Top Users (Messages)
            const topUsersQuery = `
                SELECT 
                    m.user_id, 
                    COUNT(*) as count,
                    u.username,
                    u.display_name,
                    u.avatar_url
                FROM analytics_messages m
                LEFT JOIN analytics_users u ON m.user_id = u.user_id
                GROUP BY m.user_id
                ORDER BY count DESC
                LIMIT 5
            `;
            const topUsers = db.prepare(topUsersQuery).all();

            // 4. Totals
            const totalMessages = db.prepare('SELECT COUNT(*) as c FROM analytics_messages').get() as any;
            const totalVoice = db.prepare('SELECT SUM(duration_seconds) as s FROM analytics_voice').get() as any;


            return NextResponse.json({
                daily: filledDaily,
                hourly: hourlyData,
                topUsers,
                totals: {
                    messages: totalMessages.c || 0,
                    voiceHours: Math.round((totalVoice.s || 0) / 3600 * 10) / 10
                }
            });

        } finally {
            db.close();
        }
    } catch (error: any) {
        console.error('Analytics Stats Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
