const { getVoiceConnection, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const fs = require('fs');
const { generateTTS } = require('../utils/ttsHandler');
const { getBotWelcome, getVoiceInfo, VOICES } = require('../utils/voiceSettings');

// TTS generation logic moved to shared handler

// Function to play TTS in voice channel
async function playWelcomeTTS(guildId, memberName, isBot = false) {
    const connection = getVoiceConnection(guildId);

    if (!connection) return;

    try {
        let message;
        let voice;

        if (isBot) {
            message = "Rusdi from ngawi is here!";
            voice = VOICES.putra; // Use Putra for bot welcome
        } else {
            const welcomeMessages = [
                `Halo ${memberName}, selamat datang!`,
                `Wah, ${memberName} sudah datang!`,
                `Hai ${memberName}!`,
                `Selamat datang ${memberName}!`,
                `Akhirnya ${memberName} join juga!`
            ];
            message = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
            // Use current guild voice for user welcome
            voice = getVoiceInfo(guildId);
        }

        const filePath = await generateTTS(message, voice);

        const player = createAudioPlayer();
        const resource = createAudioResource(filePath);

        connection.subscribe(player);
        player.play(resource);

        player.on(AudioPlayerStatus.Idle, () => {
            fs.unlink(filePath, () => { });
        });

        player.on('error', error => {
            console.error('Welcome TTS Error:', error);
            fs.unlink(filePath, () => { });
        });

    } catch (error) {
        console.error('Failed to play welcome TTS:', error);
    }
}

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState) {
        // Check if user joined a voice channel (wasn't in one before, now is)
        const joinedChannel = !oldState.channelId && newState.channelId;

        // Check if user moved to a different channel
        const movedChannel = oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId;

        if (joinedChannel || movedChannel) {
            // Get the bot's voice connection in this guild
            const connection = getVoiceConnection(newState.guild.id);
            const client = newState.client;

            // Only greet if bot is in the same channel
            if (connection && connection.joinConfig.channelId === newState.channelId) {

                // Logic for Bot Join Welcome
                if (newState.member.id === client.user.id) {
                    const isBotWelcomeEnabled = getBotWelcome(newState.guild.id);
                    if (isBotWelcomeEnabled) {
                        setTimeout(() => {
                            playWelcomeTTS(newState.guild.id, 'Bot', true);
                        }, 1000);
                    }
                    return;
                }

                // Logic for User Join Welcome (Ignore bots)
                if (newState.member.user.bot) return;

                // Get display name
                const memberName = newState.member.displayName || newState.member.user.username;

                // Small delay to let them fully connect
                setTimeout(() => {
                    playWelcomeTTS(newState.guild.id, memberName, false);
                }, 1000);
            }
        }
    }
};
