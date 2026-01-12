// Logic State Manager (Persistent)
// Stores current AI logic setting in settings.db

const { getSetting, setSetting } = require('./settingsDB');

const VALID_LOGICS = ['gemini', 'deepseek'];
const DEFAULT_LOGIC = 'gemini';

/**
 * Get current logic for a guild
 * @param {string} guildId 
 * @returns {'gemini' | 'deepseek'}
 */
function getLogic(guildId) {
    // Currently purely global, but function signature kept for compatibility
    return getSetting('ai_logic') || DEFAULT_LOGIC;
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
    // Update global setting
    setSetting('ai_logic', logic);
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
