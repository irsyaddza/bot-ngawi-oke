const fs = require('fs');
const path = require('path');

// Path to store voice settings
const dataDir = path.join(__dirname, '../../data');
const settingsFile = path.join(dataDir, 'voiceSettings.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Available voices
const VOICES = {
    'ardi': {
        id: 'id-ID-ArdiNeural',
        name: 'Ardi',
        emoji: '👨',
        description: 'Pria (Edge)',
        provider: 'msedge'
    },
    'gadis': {
        id: 'id-ID-GadisNeural',
        name: 'Gadis',
        emoji: '👩',
        description: 'Wanita (Edge)',
        provider: 'msedge'
    },
    'putri': {
        id: 'I7sakys8pBZ1Z5f0UhT9',
        name: 'Putri',
        emoji: '💃',
        description: 'Putri (ElevenLabs)',
        provider: 'elevenlabs'
    },
    'alice': {
        id: 'Xb7hH8MSUJpSbSDYk0k2',
        name: 'Alice',
        emoji: '👩🏼',
        description: 'Alice (ElevenLabs)',
        provider: 'elevenlabs'
    },
    'putra': {
        id: 'RWiGLY9uXI70QL540WNd',
        name: 'Putra',
        emoji: '🤵',
        description: 'Putra (ElevenLabs)',
        provider: 'elevenlabs'
    }
};

const DEFAULT_VOICE = 'ardi';

// Load settings from file
function loadSettings() {
    try {
        if (fs.existsSync(settingsFile)) {
            const data = fs.readFileSync(settingsFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading voice settings:', error);
    }
    return {};
}

// Save settings to file
function saveSettings(settings) {
    try {
        fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
    } catch (error) {
        console.error('Error saving voice settings:', error);
    }
}

// Get voice for a guild
function getVoice(guildId) {
    const settings = loadSettings();
    let voiceKey = DEFAULT_VOICE;

    if (settings[guildId]) {
        if (typeof settings[guildId] === 'string') {
            voiceKey = settings[guildId];
        } else {
            voiceKey = settings[guildId].voice || DEFAULT_VOICE;
        }
    }

    return VOICES[voiceKey]?.id || VOICES[DEFAULT_VOICE].id;
}

// Get voice info for a guild
function getVoiceInfo(guildId) {
    const settings = loadSettings();
    let voiceKey = DEFAULT_VOICE;

    if (settings[guildId]) {
        if (typeof settings[guildId] === 'string') {
            voiceKey = settings[guildId];
        } else {
            voiceKey = settings[guildId].voice || DEFAULT_VOICE;
        }
    }

    return VOICES[voiceKey] || VOICES[DEFAULT_VOICE];
}

// Set voice for a guild
function setVoice(guildId, voiceKey) {
    if (!VOICES[voiceKey]) {
        return false;
    }
    const settings = loadSettings();
    if (!settings[guildId]) settings[guildId] = {};

    // Check if settings[guildId] is string (old format) or object
    if (typeof settings[guildId] === 'string') {
        settings[guildId] = { voice: settings[guildId] };
    }

    settings[guildId].voice = voiceKey;
    saveSettings(settings);
    return true;
}

// Get bot welcome status
function getBotWelcome(guildId) {
    const settings = loadSettings();
    const guildSettings = settings[guildId];
    if (typeof guildSettings === 'string') {
        return false; // Old format didn't have this setting
    }
    return guildSettings?.botWelcome || false;
}

// Set bot welcome status
function setBotWelcome(guildId, status) {
    const settings = loadSettings();
    if (!settings[guildId]) settings[guildId] = {};

    // Migration for old format
    if (typeof settings[guildId] === 'string') {
        settings[guildId] = { voice: settings[guildId] };
    }

    settings[guildId].botWelcome = status;
    saveSettings(settings);
    return true;
}

module.exports = {
    VOICES,
    DEFAULT_VOICE,
    getVoice,
    getVoiceInfo,
    setVoice,
    getBotWelcome,
    setBotWelcome
};
