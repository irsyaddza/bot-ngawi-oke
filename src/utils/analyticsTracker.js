// Analytics Tracker - Event handlers for message and voice tracking
const { trackMessage, voiceJoin, voiceLeave, voiceMove, initAnalyticsDB } = require('./analyticsDB');

/**
 * Initialize analytics tracking on the client
 */
function initAnalyticsTracker(client) {
    // Initialize database
    initAnalyticsDB();

    // Track messages
    client.on('messageCreate', (message) => {
        // Ignore bots, DMs, and empty messages
        if (message.author.bot) return;
        if (!message.guild) return;
        if (!message.content && message.attachments.size === 0) return;

        try {
            trackMessage(message.guild.id, message.author.id, message.channel.id);
        } catch (error) {
            // Silent fail - don't break the bot if tracking fails
            console.error('[Analytics] Message tracking error:', error.message);
        }
    });

    // Track voice state changes
    client.on('voiceStateUpdate', (oldState, newState) => {
        const guildId = newState.guild?.id || oldState.guild?.id;
        const userId = newState.member?.id || oldState.member?.id;

        if (!guildId || !userId) return;

        // Ignore bots
        if (newState.member?.user?.bot || oldState.member?.user?.bot) return;

        try {
            const oldChannel = oldState.channel;
            const newChannel = newState.channel;

            if (!oldChannel && newChannel) {
                // Joined voice
                voiceJoin(guildId, userId, newChannel.id);
            } else if (oldChannel && !newChannel) {
                // Left voice
                voiceLeave(guildId, userId);
            } else if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
                // Moved channels
                voiceMove(guildId, userId, newChannel.id);
            }
        } catch (error) {
            console.error('[Analytics] Voice tracking error:', error.message);
        }
    });

    console.log('[Analytics] Tracker initialized');
}

module.exports = { initAnalyticsTracker };
