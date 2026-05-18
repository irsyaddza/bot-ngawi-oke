const fs = require('fs');
const path = require('path');

// Path to store bell settings
const dataDir = path.join(__dirname, '../../data');
const settingsFile = path.join(dataDir, 'bellSettings.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const DEFAULT_BELL = 'bell1.mp3';

// Load settings from file
function loadSettings() {
    try {
        if (fs.existsSync(settingsFile)) {
            const data = fs.readFileSync(settingsFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading bell settings:', error);
    }
    return {};
}

// Save settings to file
function saveSettings(settings) {
    try {
        fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
    } catch (error) {
        console.error('Error saving bell settings:', error);
    }
}

/**
 * Get bell configuration for a guild
 * @param {string} guildId 
 * @returns {object} {enabled: boolean, fileName: string}
 */
function getBellConfig(guildId) {
    const settings = loadSettings();
    
    if (settings[guildId]) {
        return {
            enabled: settings[guildId].enabled !== false, // default true if not set
            fileName: settings[guildId].fileName || DEFAULT_BELL
        };
    }

    return {
        enabled: true,
        fileName: DEFAULT_BELL
    };
}

/**
 * Check if bell is enabled for a guild
 * @param {string} guildId 
 * @returns {boolean}
 */
function isBellEnabled(guildId) {
    return getBellConfig(guildId).enabled;
}

/**
 * Get bell file name for a guild
 * @param {string} guildId 
 * @returns {string}
 */
function getBellFileName(guildId) {
    return getBellConfig(guildId).fileName;
}

/**
 * Set bell file name for a guild
 * @param {string} guildId 
 * @param {string} fileName 
 */
function setBellFileName(guildId, fileName) {
    const settings = loadSettings();
    if (!settings[guildId]) {
        settings[guildId] = {};
    }
    settings[guildId].fileName = fileName;
    settings[guildId].enabled = true; // Enable when setting
    saveSettings(settings);
}

/**
 * Enable bell for a guild
 * @param {string} guildId 
 */
function enableBell(guildId) {
    const settings = loadSettings();
    if (!settings[guildId]) {
        settings[guildId] = { fileName: DEFAULT_BELL };
    }
    settings[guildId].enabled = true;
    saveSettings(settings);
}

/**
 * Disable bell for a guild
 * @param {string} guildId 
 */
function disableBell(guildId) {
    const settings = loadSettings();
    if (!settings[guildId]) {
        settings[guildId] = { fileName: DEFAULT_BELL };
    }
    settings[guildId].enabled = false;
    saveSettings(settings);
}

module.exports = {
    getBellConfig,
    isBellEnabled,
    getBellFileName,
    setBellFileName,
    enableBell,
    disableBell,
    DEFAULT_BELL
};
