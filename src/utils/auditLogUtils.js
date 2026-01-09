const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

const DATA_FILE = path.join(__dirname, '../../data/auditLogConfig.json');

// Ensure data directory exists
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Load state from file
function loadState() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Error loading audit log config:', e);
    }
    return {};
}

// Save state to file
function saveState(state) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
    } catch (e) {
        console.error('Error saving audit log config:', e);
    }
}

// In-memory cache
let auditState = loadState();

/**
 * Set audit log channel for a guild
 * @param {string} guildId 
 * @param {string} channelId 
 */
function setLogChannel(guildId, channelId) {
    auditState[guildId] = {
        channelId: channelId,
        enabled: true,
        updatedAt: Date.now()
    };
    saveState(auditState);
}

/**
 * Disable audit log for a guild
 * @param {string} guildId 
 */
function disableLog(guildId) {
    if (auditState[guildId]) {
        delete auditState[guildId];
        saveState(auditState);
        return true;
    }
    return false;
}

/**
 * Get audit log channel ID for a guild
 * @param {string} guildId 
 * @returns {string|null}
 */
function getLogChannelId(guildId) {
    if (auditState[guildId] && auditState[guildId].enabled) {
        return auditState[guildId].channelId;
    }
    return null;
}

/**
 * Send an embed to the configured audit log channel
 * @param {Guild} guild 
 * @param {EmbedBuilder} embed 
 */
async function sendAuditLog(guild, embed) {
    const channelId = getLogChannelId(guild.id);
    if (!channelId) return;

    try {
        const channel = await guild.channels.fetch(channelId);
        if (channel) {
            await channel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error(`Failed to send audit log in guild ${guild.id}:`, error);
    }
}

module.exports = {
    setLogChannel,
    disableLog,
    getLogChannelId,
    sendAuditLog
};
