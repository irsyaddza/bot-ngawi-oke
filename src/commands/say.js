const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const path = require('path');
const fs = require('fs');

// Ensure temp directory exists
const tempDir = path.join(__dirname, '../../temp');
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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('Bot akan mengucapkan pesan yang kamu ketik')
        .addStringOption(option =>
            option.setName('pesan')
                .setDescription('Pesan yang ingin diucapkan bot')
                .setRequired(true)
                .setMaxLength(200)
        ),

    async execute(interaction) {
        const connection = getVoiceConnection(interaction.guild.id);

        if (!connection) {
            return interaction.reply({
                content: '❌ Bot harus berada di voice channel terlebih dahulu! Gunakan `/join` dulu.',
                ephemeral: true
            });
        }

        const message = interaction.options.getString('pesan');

        await interaction.deferReply({ ephemeral: true });

        try {
            const filePath = await generateTTS(message);

            // Create audio player and resource
            const player = createAudioPlayer();
            const resource = createAudioResource(filePath);

            // Subscribe connection to player
            connection.subscribe(player);

            // Play the audio
            player.play(resource);

            // Wait for audio to finish, then cleanup
            player.on(AudioPlayerStatus.Idle, () => {
                // Delete temp file
                fs.unlink(filePath, () => { });
            });

            player.on('error', error => {
                console.error('Audio player error:', error);
                fs.unlink(filePath, () => { });
            });

            await interaction.editReply({
                content: `🔊 Bot: "${message}"`
            });

        } catch (error) {
            console.error('TTS Error:', error);
            await interaction.editReply({
                content: '❌ Gagal memproses TTS. Silakan coba lagi.'
            });
        }
    }
};
