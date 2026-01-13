const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const env = process.env.APP_ENV || 'production';

const config = {
    env,
    token: env === 'development' ? process.env.DEV_DISCORD_TOKEN : process.env.DISCORD_TOKEN,
    clientId: env === 'development' ? process.env.DEV_CLIENT_ID : process.env.CLIENT_ID,
    guildId: env === 'development' ? process.env.DEV_GUILD_ID : process.env.GUILD_ID,

    // AI Keys (usually same for both, but can be separated if needed)
    geminiKey: process.env.GEMINI_API_KEY,
    elevenLabsKey: process.env.ELEVENLABS_API_KEY,
    openRouterKey: process.env.OPENROUTER_API_KEY
};

// Validation
if (!config.token) {
    console.warn(`[Config] ⚠️ Warning: Token is missing!`);
    console.warn(`[Config] ℹ️ Environment detected: '${env}'`);
    console.warn(`[Config] ℹ️ Looking for variable: '${env === 'development' ? 'DEV_DISCORD_TOKEN' : 'DISCORD_TOKEN'}'`);

    // DEBUG: Print available keys (filtered)
    const availableKeys = Object.keys(process.env).filter(key => !key.startsWith('npm_') && !key.startsWith('_'));
    console.log('[Config] 🔍 Debug - Available ENV Keys in Container:', availableKeys.join(', '));
}

module.exports = config;
