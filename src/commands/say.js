const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const path = require('path');
const fs = require('fs');
const { getVoice, getVoiceInfo } = require('../utils/voiceSettings');

// Ensure temp directory exists
const tempDir = path.join(__dirname, '../../temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Function to generate TTS using configurable provider
async function generateTTS(text, voice) {
    const provider = voice.provider || 'msedge'; // Default to msedge

    if (provider === 'elevenlabs') {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        if (!apiKey) throw new Error('ElevenLabs API Key is missing!');

        const voiceId = voice.id;
        const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': apiKey
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`ElevenLabs Error: ${JSON.stringify(error)}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Save to temp file
        const fileName = `tts-${Date.now()}.mp3`;
        const filePath = path.join(tempDir, fileName);
        fs.writeFileSync(filePath, buffer);

        return filePath;

    } else {
        // Fallback or Default: MS Edge TTS
        const tts = new MsEdgeTTS();
        await tts.setMetadata(voice.id, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

        // toFile returns { audioFilePath, metadataFilePath }
        const result = await tts.toFile(tempDir, text);
        return result.audioFilePath;
    }
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
            const voice = getVoiceInfo(interaction.guild.id);
            const filePath = await generateTTS(message, voice);

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
