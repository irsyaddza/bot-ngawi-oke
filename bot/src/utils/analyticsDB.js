// Analytics Database - SQLite operations for tracking
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db = null;

/**
 * Initialize analytics database
 */
function initAnalyticsDB() {
    if (db) return db;

    const dataDir = process.env.DATABASE_PATH || path.join(__dirname, '../../../data');
    const dbPath = path.join(dataDir, 'analytics.db');

    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(dbPath);
    // Disable WAL mode as it causes issues with Docker volume mounts on Windows (SQLITE_IOERR_SHMOPEN)
    db.pragma('journal_mode = DELETE');

    // Create tables
    db.exec(`
        -- Message tracking
        CREATE TABLE IF NOT EXISTS analytics_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            channel_id TEXT NOT NULL,
            content TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Voice tracking
        CREATE TABLE IF NOT EXISTS analytics_voice (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            channel_id TEXT NOT NULL,
            join_time DATETIME NOT NULL,
            leave_time DATETIME,
            duration_seconds INTEGER DEFAULT 0
        );

        -- Active voice sessions (for tracking ongoing sessions)
        CREATE TABLE IF NOT EXISTS analytics_voice_active (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            channel_id TEXT NOT NULL,
            join_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(guild_id, user_id)
        );

        -- Config per server
        CREATE TABLE IF NOT EXISTS analytics_config (
            guild_id TEXT PRIMARY KEY,
            channel_id TEXT NOT NULL,
            send_day INTEGER DEFAULT 0,
            send_hour INTEGER DEFAULT 9,
            enabled INTEGER DEFAULT 1
        );

        -- Unified Activity Log
        CREATE TABLE IF NOT EXISTS analytics_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guild_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            type TEXT NOT NULL, -- 'message', 'voice', 'command'
            detail TEXT, -- Content, Command Name, or Channel Name
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Indexes
        CREATE INDEX IF NOT EXISTS idx_msg_guild_time ON analytics_messages(guild_id, timestamp);
        CREATE INDEX IF NOT EXISTS idx_voice_guild_time ON analytics_voice(guild_id, join_time);
        CREATE INDEX IF NOT EXISTS idx_events_guild_time ON analytics_events(guild_id, timestamp);
    `);

    // Migration: Add content column if missing
    try {
        const columns = db.pragma('table_info(analytics_messages)');
        console.log('[Analytics] Current columns:', columns.map(c => c.name));
        const hasContent = columns.some(c => c.name === 'content');
        if (!hasContent) {
            console.log('[Analytics] Migrating: Adding content column to analytics_messages');
            db.prepare('ALTER TABLE analytics_messages ADD COLUMN content TEXT').run();
        }
    } catch (e) {
        console.error('[Analytics] Migration error:', e.message);
    }

    console.log('[Analytics] Database initialized');
    return db;
}

// ============ UNIFIED EVENT LOGGING ============

function logEvent(guildId, userId, type, detail) {
    initAnalyticsDB();
    try {
        db.prepare(`
            INSERT INTO analytics_events (guild_id, user_id, type, detail)
            VALUES (?, ?, ?, ?)
        `).run(guildId, userId, type, detail);
    } catch (e) {
        console.error('[Analytics] Log Event Error:', e.message);
    }
}

// ============ MESSAGE TRACKING ============

function trackMessage(guildId, userId, channelId, content) {
    initAnalyticsDB();
    const stmt = db.prepare(`
        INSERT INTO analytics_messages (guild_id, user_id, channel_id, content)
        VALUES (?, ?, ?, ?)
    `);
    stmt.run(guildId, userId, channelId, content || '');

    // Also log to unified events
    logEvent(guildId, userId, 'message', content ? content.substring(0, 50) : 'Sent a message');
}

// ============ VOICE TRACKING ============

function voiceJoin(guildId, userId, channelId) {
    initAnalyticsDB();
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO analytics_voice_active (guild_id, user_id, channel_id, join_time)
        VALUES (?, ?, ?, datetime('now'))
    `);
    stmt.run(guildId, userId, channelId);

    // Log join event
    logEvent(guildId, userId, 'voice', `Joined voice channel`);
}

function voiceLeave(guildId, userId) {
    initAnalyticsDB();

    // Get active session
    const active = db.prepare(`
        SELECT * FROM analytics_voice_active WHERE guild_id = ? AND user_id = ?
    `).get(guildId, userId);

    if (active) {
        // Calculate duration and save to history
        const stmt = db.prepare(`
            INSERT INTO analytics_voice (guild_id, user_id, channel_id, join_time, leave_time, duration_seconds)
            VALUES (?, ?, ?, ?, datetime('now'), 
                CAST((julianday('now') - julianday(?)) * 86400 AS INTEGER))
        `);
        stmt.run(guildId, userId, active.channel_id, active.join_time, active.join_time);

        // Remove from active
        db.prepare(`DELETE FROM analytics_voice_active WHERE guild_id = ? AND user_id = ?`).run(guildId, userId);

        // Log leave event
        logEvent(guildId, userId, 'voice', `Left voice channel`);
    }
}

function voiceMove(guildId, userId, newChannelId) {
    // Leave old channel, join new one
    voiceLeave(guildId, userId);
    voiceJoin(guildId, userId, newChannelId);

    // Log move event (voiceJoin and voiceLeave handled above, but maybe specific move log? 
    // Actually voiceLeave then voiceJoin is enough, but 'Moved' is cleaner.
    // However, since we call Leave then Join, it will log "Left" then "Joined".
    // Let's overwrite the last "Left" with "Moved" or just let it be.
    // For simplicity, let's explicit log move here if we want, or just rely on Join/Leave.
    // The previous calls handle it. But to be precise:
    logEvent(guildId, userId, 'voice', `Moved voice channel`);
}

// ============ CONFIG ============

function saveAnalyticsConfig(guildId, channelId, sendDay = 0, sendHour = 9) {
    initAnalyticsDB();
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO analytics_config (guild_id, channel_id, send_day, send_hour, enabled)
        VALUES (?, ?, ?, ?, 1)
    `);
    stmt.run(guildId, channelId, sendDay, sendHour);
}

function getAnalyticsConfig(guildId) {
    initAnalyticsDB();
    return db.prepare('SELECT * FROM analytics_config WHERE guild_id = ? AND enabled = 1').get(guildId);
}

function getAllAnalyticsConfigs() {
    initAnalyticsDB();
    return db.prepare('SELECT * FROM analytics_config WHERE enabled = 1').all();
}

function disableAnalytics(guildId) {
    initAnalyticsDB();
    db.prepare('UPDATE analytics_config SET enabled = 0 WHERE guild_id = ?').run(guildId);
}

// ============ STATS QUERIES ============

function getWeeklyMessageStats(guildId) {
    initAnalyticsDB();

    // Get stats for current week (last 7 days)
    const stats = db.prepare(`
        SELECT 
            user_id,
            COUNT(*) as message_count,
            COUNT(DISTINCT DATE(timestamp)) as active_days
        FROM analytics_messages
        WHERE guild_id = ? 
        AND timestamp >= datetime('now', '-7 days')
        GROUP BY user_id
        ORDER BY message_count DESC
    `).all(guildId);

    return stats;
}

function getWeeklyVoiceStats(guildId) {
    initAnalyticsDB();

    const stats = db.prepare(`
        SELECT 
            user_id,
            SUM(duration_seconds) as total_seconds,
            COUNT(*) as session_count
        FROM analytics_voice
        WHERE guild_id = ?
        AND join_time >= datetime('now', '-7 days')
        GROUP BY user_id
        ORDER BY total_seconds DESC
    `).all(guildId);

    return stats;
}

function getDailyMessageBreakdown(guildId) {
    initAnalyticsDB();

    const breakdown = db.prepare(`
        SELECT 
            DATE(timestamp) as date,
            strftime('%w', timestamp) as day_of_week,
            COUNT(*) as count
        FROM analytics_messages
        WHERE guild_id = ?
        AND timestamp >= datetime('now', '-7 days')
        GROUP BY DATE(timestamp)
        ORDER BY date
    `).all(guildId);

    return breakdown;
}

function getChannelStats(guildId) {
    initAnalyticsDB();

    return db.prepare(`
        SELECT 
            channel_id,
            COUNT(*) as message_count
        FROM analytics_messages
        WHERE guild_id = ?
        AND timestamp >= datetime('now', '-7 days')
        GROUP BY channel_id
        ORDER BY message_count DESC
        LIMIT 5
    `).all(guildId);
}

function getLastWeekTotal(guildId) {
    initAnalyticsDB();

    return db.prepare(`
        SELECT COUNT(*) as count
        FROM analytics_messages
        WHERE guild_id = ?
        AND timestamp >= datetime('now', '-14 days')
        AND timestamp < datetime('now', '-7 days')
    `).get(guildId);
}

function getUserStats(guildId, userId) {
    initAnalyticsDB();

    const messages = db.prepare(`
        SELECT COUNT(*) as count
        FROM analytics_messages
        WHERE guild_id = ? AND user_id = ?
        AND timestamp >= datetime('now', '-7 days')
    `).get(guildId, userId);

    const voice = db.prepare(`
        SELECT COALESCE(SUM(duration_seconds), 0) as total_seconds
        FROM analytics_voice
        WHERE guild_id = ? AND user_id = ?
        AND join_time >= datetime('now', '-7 days')
    `).get(guildId, userId);

    return {
        messages: messages?.count || 0,
        voiceSeconds: voice?.total_seconds || 0
    };
}

// ============ TEST FUNCTIONS ============

/**
 * Seed dummy data for testing
 * @param {string} guildId - Guild ID
 * @param {number} userCount - Number of fake users
 * @param {number} days - Number of days to generate data for
 * @param {Array} realUserIds - Optional array of real user IDs to use
 */
function seedDummyData(guildId, userCount = 10, days = 7, realUserIds = []) {
    initAnalyticsDB();

    // Generate fake user IDs or use real ones
    const userIds = realUserIds.length > 0
        ? realUserIds.slice(0, userCount)
        : Array.from({ length: userCount }, (_, i) => `dummy_user_${i + 1}`);

    // Use real user IDs if provided, pad with dummy if needed
    while (userIds.length < userCount) {
        userIds.push(`dummy_user_${userIds.length + 1}`);
    }

    const channelId = 'dummy_channel_1';
    let totalMessages = 0;
    let totalVoiceSessions = 0;

    const insertMsg = db.prepare(`
        INSERT INTO analytics_messages (guild_id, user_id, channel_id, timestamp)
        VALUES (?, ?, ?, ?)
    `);

    const insertVoice = db.prepare(`
        INSERT INTO analytics_voice (guild_id, user_id, channel_id, join_time, leave_time, duration_seconds)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Wrap in transaction for better performance
    const seedTransaction = db.transaction(() => {
        for (let d = 0; d < days; d++) {
            const dayOffset = days - d - 1;

            for (const userId of userIds) {
                // Random messages per day (10-50 to reduce volume)
                const msgCount = Math.floor(Math.random() * 41) + 10;

                for (let m = 0; m < msgCount; m++) {
                    const hour = Math.floor(Math.random() * 24);
                    const minute = Math.floor(Math.random() * 60);
                    const timestamp = new Date();
                    timestamp.setDate(timestamp.getDate() - dayOffset);
                    timestamp.setHours(hour, minute, 0, 0);

                    insertMsg.run(guildId, userId, channelId, timestamp.toISOString());
                    totalMessages++;
                }

                // Random voice sessions per day (0-2)
                const voiceSessions = Math.floor(Math.random() * 3);

                for (let v = 0; v < voiceSessions; v++) {
                    const startHour = Math.floor(Math.random() * 22);
                    const duration = Math.floor(Math.random() * 7200) + 300;

                    const joinTime = new Date();
                    joinTime.setDate(joinTime.getDate() - dayOffset);
                    joinTime.setHours(startHour, 0, 0, 0);

                    const leaveTime = new Date(joinTime.getTime() + duration * 1000);

                    insertVoice.run(
                        guildId,
                        userId,
                        channelId,
                        joinTime.toISOString(),
                        leaveTime.toISOString(),
                        duration
                    );
                    totalVoiceSessions++;
                }
            }
        }
    });

    // Execute transaction
    seedTransaction();

    return {
        users: userIds.length,
        days,
        messages: totalMessages,
        voiceSessions: totalVoiceSessions
    };
}

/**
 * Clear all analytics data for a guild
 */
function clearAnalyticsData(guildId) {
    initAnalyticsDB();

    const msgResult = db.prepare('DELETE FROM analytics_messages WHERE guild_id = ?').run(guildId);
    const voiceResult = db.prepare('DELETE FROM analytics_voice WHERE guild_id = ?').run(guildId);
    const activeResult = db.prepare('DELETE FROM analytics_voice_active WHERE guild_id = ?').run(guildId);

    return {
        messagesDeleted: msgResult.changes,
        voiceSessionsDeleted: voiceResult.changes,
        activeSessionsDeleted: activeResult.changes
    };
}

/**
 * Get total counts for a guild (for confirmation)
 */
function getDataCounts(guildId) {
    initAnalyticsDB();

    const messages = db.prepare('SELECT COUNT(*) as count FROM analytics_messages WHERE guild_id = ?').get(guildId);
    const voice = db.prepare('SELECT COUNT(*) as count FROM analytics_voice WHERE guild_id = ?').get(guildId);

    return {
        messages: messages?.count || 0,
        voiceSessions: voice?.count || 0
    };
}

module.exports = {
    initAnalyticsDB,
    trackMessage,
    voiceJoin,
    voiceLeave,
    voiceMove,
    logEvent,
    saveAnalyticsConfig,
    getAnalyticsConfig,
    getAllAnalyticsConfigs,
    disableAnalytics,
    getWeeklyMessageStats,
    getWeeklyVoiceStats,
    getDailyMessageBreakdown,
    getChannelStats,
    getLastWeekTotal,
    getUserStats,
    // Test functions
    seedDummyData,
    clearAnalyticsData,
    getDataCounts
};

