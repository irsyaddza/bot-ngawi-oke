const { SlashCommandBuilder } = require('discord.js');
const { setBotWelcome, getBotWelcome } = require('../utils/voiceSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('voicewelcome')
        .setDescription('Toggle pesan selamat datang kusus bot (Rusdi from Ngawi)')
        .addStringOption(option =>
            option.setName('status')
                .setDescription('Aktifkan atau matikan fitur')
                .setRequired(true)
                .addChoices(
                    { name: 'Enable (Aktif)', value: 'enable' },
                    { name: 'Disable (Mati)', value: 'disable' }
                )
        ),

    async execute(interaction) {
        const status = interaction.options.getString('status');
        const isEnabled = status === 'enable';

        setBotWelcome(interaction.guild.id, isEnabled);

        await interaction.reply({
            content: `✅ Bot Voice Welcome berhasil **${isEnabled ? 'diaktifkan' : 'dimatikan'}**.\nBot akan ${isEnabled ? 'berkata "Rusdi from ngawi is here!"' : 'diam'} saat join voice channel.`,
            ephemeral: true
        });
    }
};
