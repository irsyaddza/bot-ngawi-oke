const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { clearHistory } = require('../utils/chatHistoryDB');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearchat')
        .setDescription('🗑️ Hapus chat history AI untuk server ini')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        try {
            // Clear history for this guild
            const success = clearHistory(interaction.guildId);

            if (success) {
                const embed = new EmbedBuilder()
                    .setColor('#00FF88')
                    .setTitle('🗑️ Chat History Cleared')
                    .setDescription('Semua memori percakapan AI untuk server ini telah dihapus.\nRusdi akan mulai dari awal lagi!')
                    .setFooter({ text: `Cleared by ${interaction.user.username}` })
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            } else {
                await interaction.reply({
                    content: '❌ Gagal menghapus chat history atau database belum ada.',
                    ephemeral: false
                });
            }
        } catch (error) {
            console.error('ClearChat Error:', error);
            await interaction.reply({
                content: `❌ Error: ${error.message}`,
                ephemeral: true
            });
        }
    }
};
