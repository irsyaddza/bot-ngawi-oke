// Logic State Manager (Persistent)
// Stores current AI logic setting per-guild in JSON file

const fs = require('fs');
const path = require('path');

const VALID_LOGICS = ['gemini', 'deepseek'];
const DEFAULT_LOGIC = 'gemini';
const DATA_FILE = path.join(__dirname, '../../data/logicState.json');

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
        console.error('Error loading logic state:', e);
    }
    return {};
}

// Save state to file
function saveState(state) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
    } catch (e) {
        console.error('Error saving logic state:', e);
    }
}

// In-memory cache
let logicState = loadState();

/**
 * Get current logic for a guild
 * @param {string} guildId 
 * @returns {'gemini' | 'deepseek'}
 */
function getLogic(guildId) {
    return logicState[guildId] || DEFAULT_LOGIC;
}

/**
 * Set logic for a guild (persists to file)
 * @param {string} guildId 
 * @param {'gemini' | 'deepseek'} logic 
 */
function setLogic(guildId, logic) {
    if (!VALID_LOGICS.includes(logic)) {
        throw new Error(`Invalid logic: ${logic}. Valid options: ${VALID_LOGICS.join(', ')}`);
    }
    logicState[guildId] = logic;
    saveState(logicState);
}

/**
 * Get all valid logic options
 * @returns {string[]}
 */
function getValidLogics() {
    return VALID_LOGICS;
}

module.exports = {
    getLogic,
    setLogic,
    getValidLogics,
    DEFAULT_LOGIC
};
