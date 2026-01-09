const { Events, ActivityType } = require('discord.js');
const { getLogic, DEFAULT_LOGIC } = require('../utils/logicState');
const fs = require('fs');
const path = require('path');

// Export function to update activity (used by logic.js)
function updateLogicActivity(client, logic) {
    const logicNames = {
        gemini: '🔵 Gemini AI',
        deepseek: '🟢 DeepSeek AI'
    };
    const activityName = logicNames[logic] || logicNames[DEFAULT_LOGIC];
    console.log(`Setting activity to: "${activityName}" for logic: ${logic}`);
    client.user.setActivity(activityName, {
        type: ActivityType.Playing
    });
}

// Get first saved logic (for activity on startup)
function getFirstSavedLogic() {
    try {
        const dataFile = path.join(__dirname, '../../data/logicState.json');
        if (fs.existsSync(dataFile)) {
            const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
            const firstGuildId = Object.keys(data)[0];
            if (firstGuildId) {
                return data[firstGuildId];
            }
        }
    } catch (e) {
        console.error('Error reading saved logic:', e);
    }
    return DEFAULT_LOGIC;
}

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);

        // Set initial activity based on saved logic (first guild)
        const savedLogic = getFirstSavedLogic();
        updateLogicActivity(client, savedLogic);
    },
    updateLogicActivity // Export for use in logic.js
};

