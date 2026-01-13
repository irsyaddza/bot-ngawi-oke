// Analytics Tracker - Event handlers for message and voice tracking
const { trackMessage, voiceJoin, voiceLeave, voiceMove, initAnalyticsDB, updateUserCache } = require('./analyticsDB');

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
            // Update user cache
            updateUserCache(
                message.author.id,
                message.author.username,
                message.member?.displayName || message.author.globalName,
                message.author.displayAvatarURL({ extension: 'png' })
            );

            trackMessage(message.guild.id, message.author.id, message.channel.id, message.content);
        } catch (error) {
            // Silent fail - don't break the bot if tracking fails
            console.error('[Analytics] Message tracking error:', error.message);
        }
    });

    // Track voice state changes
    client.on('voiceStateUpdate', (oldState, newState) => {
        const guildId = newState.guild?.id || oldState.guild?.id;
        const userId = newState.member?.id || oldState.member?.id;
        const member = newState.member || oldState.member;

        if (!guildId || !userId) return;

        // Ignore bots
        if (member?.user?.bot) return;

        try {
            // Update user cache
            if (member?.user) {
                updateUserCache(
                    member.user.id,
                    member.user.username,
                    member.displayName || member.user.globalName,
                    member.user.displayAvatarURL({ extension: 'png' })
                );
            }

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

    // Track Slash Commands
    client.on('interactionCreate', (interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.guild) return;

        try {
            // Update user cache
            updateUserCache(
                interaction.user.id,
                interaction.user.username,
                interaction.member?.displayName || interaction.user.globalName,
                interaction.user.displayAvatarURL({ extension: 'png' })
            );

            const { logEvent } = require('./analyticsDB');
            logEvent(
                interaction.guild.id,
                interaction.user.id,
                'command',
                `Used command: /${interaction.commandName}`
            );
        } catch (error) {
            console.error('[Analytics] Command tracking error:', error.message);
        }
    });

    console.log('[Analytics] Tracker initialized');
}

module.exports = { initAnalyticsTracker };
