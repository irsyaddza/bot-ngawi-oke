const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const { playMP3 } = require('../utils/audioUtils');
const { getBellFileName } = require('../utils/bellSettings');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('testbell')
        .setDescription('Test pemutaran bel peringatan di voice channel')
        .addStringOption(option =>
            option.setName('filename')
                .setDescription('Nama file MP3 (gunakan current bell jika tidak diisi)')
                .setRequired(false)
        ),

    async execute(interaction) {
        // Check if user is in a voice channel
        if (!interaction.member.voice.channel) {
            return await interaction.reply({
                content: '❌ Kamu harus berada di voice channel untuk test bell!',
                ephemeral: true
            });
        }

        const fileName = interaction.options.getString('filename') || getBellFileName(interaction.guild.id);
        const connection = getVoiceConnection(interaction.guild.id);

        if (!connection) {
            return await interaction.reply({
                content: '❌ Bot tidak terhubung ke voice channel!',
                ephemeral: true
            });
        }

        // Check if file exists
        const filePath = path.join(__dirname, '../assets', fileName);
        if (!fs.existsSync(filePath)) {
            const assetsDir = path.join(__dirname, '../assets');
            const files = fs.readdirSync(assetsDir).filter(f => f.endsWith('.mp3'));
            
            let fileList = files.length > 0 
                ? files.map(f => `• ${f}`).join('\n')
                : '(Tidak ada file MP3 di folder assets)';

            return await interaction.reply({
                content: `❌ File **${fileName}** tidak ditemukan!\n\n📂 File MP3 yang tersedia:\n${fileList}`,
                ephemeral: true
            });
        }

        try {
            await interaction.reply({
                content: `🔔 Testing bel: **${fileName}**...`,
                ephemeral: true
            });

            await playMP3(connection, fileName);

            await interaction.editReply({
                content: `✅ Bel **${fileName}** selesai dimainkan!`
            });
        } catch (error) {
            console.error('[TestBell] Error:', error);
            await interaction.editReply({
                content: `❌ Gagal memainkan bel: ${error.message}`
            });
        }
    }
};
