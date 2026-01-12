// Weather Scheduler - Daily weather updates
const cron = require('node-cron');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { getWeather, formatWeatherMessage } = require('./weatherService');
const { EmbedBuilder } = require('discord.js');

let db = null;

/**
 * Initialize weather database
 */
function initWeatherDB() {
    if (db) return db;

    const dataDir = process.env.DATABASE_PATH || path.join(__dirname, '../../../data');
    const dbPath = path.join(dataDir, 'weather.db');

    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
        console.log(`[Weather] Creating data directory at: ${dataDir}`);
        fs.mkdirSync(dataDir, { recursive: true });
    }

    // DEBUG: Log resolved path
    console.log(`[Weather] initWeatherDB - DataDir: ${dataDir}`);
    console.log(`[Weather] initWeatherDB - DBPath: ${dbPath}`);

    db = new Database(dbPath);

    db.exec(`
        CREATE TABLE IF NOT EXISTS weather_config (
            guild_id TEXT PRIMARY KEY,
            channel_id TEXT NOT NULL,
            location TEXT NOT NULL,
            latitude REAL,
            longitude REAL,
            send_hour INTEGER DEFAULT 6,
            enabled INTEGER DEFAULT 1
        )
    `);

    console.log('[Weather] Database initialized');
    return db;
}

/**
 * Save weather config for a server
 */
function saveWeatherConfig(guildId, channelId, location, latitude, longitude, sendHour = 6) {
    initWeatherDB();
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO weather_config 
        (guild_id, channel_id, location, latitude, longitude, send_hour, enabled)
        VALUES (?, ?, ?, ?, ?, ?, 1)
    `);
    stmt.run(guildId, channelId, location, latitude, longitude, sendHour);
}

/**
 * Get weather config for a server
 */
function getWeatherConfig(guildId) {
    initWeatherDB();
    const stmt = db.prepare('SELECT * FROM weather_config WHERE guild_id = ? AND enabled = 1');
    return stmt.get(guildId);
}

/**
 * Get all enabled weather configs
 */
function getAllWeatherConfigs() {
    initWeatherDB();
    const stmt = db.prepare('SELECT * FROM weather_config WHERE enabled = 1');
    const rows = stmt.all();
    console.log(`[Weather] getAllWeatherConfigs - Found ${rows.length} rows (enabled=1)`);
    return rows;
}

/**
 * Get ALL weather configs (Active & Disabled) for Admin
 */
function getAllWeatherConfigsRaw() {
    initWeatherDB();
    const stmt = db.prepare('SELECT * FROM weather_config'); // No filter
    const rows = stmt.all();
    console.log(`[Weather] getAllWeatherConfigsRaw - Found ${rows.length} total rows`);
    return rows;
}

/**
 * Disable weather for a server
 */
function disableWeather(guildId) {
    initWeatherDB();
    const stmt = db.prepare('UPDATE weather_config SET enabled = 0 WHERE guild_id = ?');
    return stmt.run(guildId);
}

/**
 * Disable weather by location name (Admin)
 */
function disableWeatherByLocation(location) {
    initWeatherDB();
    // Using LIKE for flexible matching (case-insensitive in SQLite usually)
    const stmt = db.prepare('UPDATE weather_config SET enabled = 0 WHERE location LIKE ?');
    return stmt.run(`%${location}%`);
}

/**
 * Send weather update to a channel
 */
async function sendWeatherUpdate(client, config) {
    try {
        const channel = await client.channels.fetch(config.channel_id);
        if (!channel) {
            console.error(`[Weather] Channel ${config.channel_id} not found`);
            return;
        }

        const weather = await getWeather(config.location);
        if (weather.error) {
            console.error(`[Weather] Error for ${config.location}: ${weather.error}`);
            return;
        }

        const message = formatWeatherMessage(weather);

        const embed = new EmbedBuilder()
            .setColor('#00a8ff')
            .setDescription(message)
            .setTimestamp()
            .setFooter({ text: 'Powered by Open-Meteo' });

        await channel.send({ embeds: [embed] });
        console.log(`[Weather] Sent update to ${channel.name} for ${config.location}`);

    } catch (error) {
        console.error('[Weather] Send error:', error);
    }
}

/**
 * Start the weather scheduler
 */
function startWeatherScheduler(client) {
    initWeatherDB();

    // Check every hour if any server needs weather update
    cron.schedule('0 * * * *', async () => {
        const currentHour = new Date().getHours();
        const configs = getAllWeatherConfigs();

        for (const config of configs) {
            if (config.send_hour === currentHour) {
                console.log(`[Weather] Sending scheduled update for guild ${config.guild_id}`);
                await sendWeatherUpdate(client, config);
            }
        }
    });

    console.log('[Weather] Scheduler started - checking every hour');
    console.log(`[Weather] Current System Time: ${new Date().toString()}`);
}

module.exports = {
    initWeatherDB,
    saveWeatherConfig,
    getWeatherConfig,
    getAllWeatherConfigs,
    getAllWeatherConfigsRaw,
    disableWeather,
    disableWeatherByLocation,
    sendWeatherUpdate,
    startWeatherScheduler
};
