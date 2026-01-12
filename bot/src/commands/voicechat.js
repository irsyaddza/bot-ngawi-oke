const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const { setVoiceChatEnabled, getVoiceChatEnabled } = require('../utils/voiceSettings');
const { startVoiceListener, stopVoiceListener, isListenerActive } = require('../utils/voiceListener');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('voicechat')
        .setDescription('Aktifkan/nonaktifkan voice chat AI (Rusdi from Ngawi)')
        .addStringOption(option =>
            option.setName('status')
                .setDescription('Enable atau disable voice chat')
                .setRequired(true)
                .addChoices(
                    { name: '🟢 Enable (Aktif)', value: 'enable' },
                    { name: '🔴 Disable (Mati)', value: 'disable' }
                )
        ),

    async execute(interaction) {
        const status = interaction.options.getString('status');
        const isEnable = status === 'enable';
        const guildId = interaction.guild.id;

        // Check if bot is in voice channel
        const connection = getVoiceConnection(guildId);

        if (isEnable) {
            if (!connection) {
                return interaction.reply({
                    content: '❌ Bot harus berada di voice channel terlebih dahulu!\nGunakan `/join` untuk memasukkan bot ke voice channel.',
                    ephemeral: true
                });
            }

            // Enable voice chat
            setVoiceChatEnabled(guildId, true);
            startVoiceListener(connection, interaction.guild, interaction.channel);

            await interaction.reply({
                content: `🎙️ **Voice Chat AI telah diaktifkan!**\n\n` +
                    `Cara menggunakan:\n` +
                    `1. Bicara di voice channel\n` +
                    `2. Panggil dengan **"Halo Rusdi, ..."** diikuti pertanyaan/obrolan\n` +
                    `3. Tunggu Rusdi menjawab dengan suara\n\n` +
                    `_Gunakan \`/voicechat disable\` untuk mematikan._`,
                ephemeral: false
            });

        } else {
            // Disable voice chat
            setVoiceChatEnabled(guildId, false);
            stopVoiceListener(guildId);

            await interaction.reply({
                content: '🔇 **Voice Chat AI telah dinonaktifkan.**\n' +
                    '_Bot tidak akan lagi mendengarkan dan merespons di voice channel._',
                ephemeral: false
            });
        }
    }
};
