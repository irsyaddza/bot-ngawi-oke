// Voice Lock State Manager (Persistent)
// Stores locked voice channels with whitelist per-guild

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../../data/voiceLock.json');

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
        console.error('Error loading voice lock state:', e);
    }
    return {};
}

// Save state to file
function saveState(state) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
    } catch (e) {
        console.error('Error saving voice lock state:', e);
    }
}

// In-memory cache
let lockState = loadState();

/**
 * Lock a voice channel
 * @param {string} guildId 
 * @param {string} channelId 
 * @param {string[]} allowedUsers - Array of user IDs allowed to join
 * @param {string[]} allowedRoles - Array of role IDs allowed to join
 */
function lockChannel(guildId, channelId, allowedUsers = [], allowedRoles = []) {
    if (!lockState[guildId]) {
        lockState[guildId] = {};
    }
    lockState[guildId][channelId] = {
        locked: true,
        allowedUsers,
        allowedRoles,
        lockedAt: Date.now()
    };
    saveState(lockState);
}

/**
 * Unlock a voice channel
 * @param {string} guildId 
 * @param {string} channelId 
 */
function unlockChannel(guildId, channelId) {
    if (lockState[guildId] && lockState[guildId][channelId]) {
        delete lockState[guildId][channelId];
        saveState(lockState);
        return true;
    }
    return false;
}

/**
 * Check if a channel is locked
 * @param {string} guildId 
 * @param {string} channelId 
 * @returns {object|null} Lock info or null if not locked
 */
function getLockInfo(guildId, channelId) {
    if (lockState[guildId] && lockState[guildId][channelId]) {
        return lockState[guildId][channelId];
    }
    return null;
}

/**
 * Check if a member is allowed to join a locked channel
 * @param {string} guildId 
 * @param {string} channelId 
 * @param {GuildMember} member 
 * @returns {boolean}
 */
function isAllowed(guildId, channelId, member) {
    const lockInfo = getLockInfo(guildId, channelId);
    if (!lockInfo) return true; // Not locked

    // Check if user is in allowed list
    if (lockInfo.allowedUsers.includes(member.id)) {
        return true;
    }

    // Check if user has any allowed role
    for (const roleId of lockInfo.allowedRoles) {
        if (member.roles.cache.has(roleId)) {
            return true;
        }
    }

    return false;
}

/**
 * Get all locked channels for a guild
 * @param {string} guildId 
 * @returns {object}
 */
function getLockedChannels(guildId) {
    return lockState[guildId] || {};
}

/**
 * Add users/roles to whitelist of a locked channel
 * @param {string} guildId 
 * @param {string} channelId 
 * @param {string[]} users - User IDs to add
 * @param {string[]} roles - Role IDs to add
 * @returns {boolean} - true if channel was locked and updated
 */
function addToWhitelist(guildId, channelId, users = [], roles = []) {
    const lockInfo = getLockInfo(guildId, channelId);
    if (!lockInfo) return false;

    // Add users (avoid duplicates)
    for (const userId of users) {
        if (!lockInfo.allowedUsers.includes(userId)) {
            lockInfo.allowedUsers.push(userId);
        }
    }

    // Add roles (avoid duplicates)
    for (const roleId of roles) {
        if (!lockInfo.allowedRoles.includes(roleId)) {
            lockInfo.allowedRoles.push(roleId);
        }
    }

    saveState(lockState);
    return true;
}

/**
 * Remove users/roles from whitelist of a locked channel
 * @param {string} guildId 
 * @param {string} channelId 
 * @param {string[]} users - User IDs to remove
 * @param {string[]} roles - Role IDs to remove
 * @returns {boolean} - true if channel was locked and updated
 */
function removeFromWhitelist(guildId, channelId, users = [], roles = []) {
    const lockInfo = getLockInfo(guildId, channelId);
    if (!lockInfo) return false;

    // Remove users
    lockInfo.allowedUsers = lockInfo.allowedUsers.filter(id => !users.includes(id));

    // Remove roles
    lockInfo.allowedRoles = lockInfo.allowedRoles.filter(id => !roles.includes(id));

    saveState(lockState);
    return true;
}

module.exports = {
    lockChannel,
    unlockChannel,
    getLockInfo,
    isAllowed,
    getLockedChannels,
    addToWhitelist,
    removeFromWhitelist
};
