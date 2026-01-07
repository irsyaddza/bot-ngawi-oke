const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const fs = require('fs');
const { getVoice, getVoiceInfo } = require('../utils/voiceSettings');
const { generateTTS } = require('../utils/ttsHandler');

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
