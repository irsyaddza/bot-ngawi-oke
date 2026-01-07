const { getVoiceConnection, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const path = require('path');
const fs = require('fs');

// Ensure temp directory exists
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Function to generate TTS using Edge TTS (male Indonesian voice)
async function generateTTS(text) {
    const tts = new MsEdgeTTS();
    // Use Indonesian male voice - Ardi (adult male)
    await tts.setMetadata('id-ID-ArdiNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    // toFile returns { audioFilePath, metadataFilePath }
    const result = await tts.toFile(tempDir, text);
    tts.close();

    return result.audioFilePath;
}

// Function to play TTS in voice channel
async function playWelcomeTTS(guildId, memberName) {
    const connection = getVoiceConnection(guildId);

    if (!connection) return;

    try {
        const welcomeMessages = [
            `Halo ${memberName}, selamat datang!`,
            `Wah, ${memberName} sudah datang!`,
            `Hai ${memberName}!`,
            `Selamat datang ${memberName}!`,
            `Akhirnya ${memberName} join juga!`
        ];

        const message = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
        const filePath = await generateTTS(message);

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
        // Ignore bot users
        if (newState.member.user.bot) return;

        // Check if user joined a voice channel (wasn't in one before, now is)
        const joinedChannel = !oldState.channelId && newState.channelId;

        // Check if user moved to a different channel
        const movedChannel = oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId;

        if (joinedChannel || movedChannel) {
            // Get the bot's voice connection in this guild
            const connection = getVoiceConnection(newState.guild.id);

            // Only greet if bot is in the same channel
            if (connection && connection.joinConfig.channelId === newState.channelId) {
                // Get display name
                const memberName = newState.member.displayName || newState.member.user.username;

                // Small delay to let them fully connect
                setTimeout(() => {
                    playWelcomeTTS(newState.guild.id, memberName);
                }, 1000);
            }
        }
    }
};
