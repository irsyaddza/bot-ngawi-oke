const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

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
    console.warn(`[Config] ⚠️ Warning: Token is missing for environment: ${env}`);
}

module.exports = config;
