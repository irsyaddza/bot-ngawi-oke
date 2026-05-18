const { SlashCommandBuilder } = require('discord.js');
const { setBellFileName, getBellFileName } = require('../utils/bellSettings');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('changebell')
        .setDescription('Ubah file bell peringatan untuk voice welcome')
        .addStringOption(option =>
            option.setName('filename')
                .setDescription('Nama file MP3 di folder assets (contoh: bell1.mp3)')
                .setRequired(true)
        ),

    async execute(interaction) {
        const fileName = interaction.options.getString('filename');
        const filePath = path.join(__dirname, '../assets', fileName);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            const assetsDir = path.join(__dirname, '../assets');
            const files = fs.readdirSync(assetsDir).filter(f => f.endsWith('.mp3'));
            
            let fileList = files.length > 0 
                ? files.map(f => `• ${f}`).join('\n')
                : '(Tidak ada file MP3 di folder assets)';

            return await interaction.reply({
                content: `❌ File **${fileName}** tidak ditemukan di folder assets!\n\n📂 File MP3 yang tersedia:\n${fileList}`,
                ephemeral: true
            });
        }

        // Set the bell file
        setBellFileName(interaction.guild.id, fileName);

        return await interaction.reply({
            content: `✅ Bell berhasil diubah menjadi **${fileName}**\n🔔 Bell akan diputar sebelum voice welcome dimulai.`,
            ephemeral: true
        });
    }
};
