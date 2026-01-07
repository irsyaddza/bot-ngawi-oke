const { SlashCommandBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Bot akan keluar dari voice channel'),

    async execute(interaction) {
        const connection = getVoiceConnection(interaction.guild.id);

        if (!connection) {
            return interaction.reply({
                content: '❌ Bot tidak sedang berada di voice channel manapun!',
                ephemeral: true
            });
        }

        connection.destroy();

        await interaction.reply({
            content: '✅ Bot telah keluar dari voice channel.',
            ephemeral: true
        });
    }
};
