const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { clearAllHistory } = require('../utils/chatHistoryDB');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearchat')
        .setDescription('🗑️ Hapus SEMUA chat history AI (seluruh database)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        try {
            // Clear ALL history from database
            const deletedRows = clearAllHistory();

            const embed = new EmbedBuilder()
                .setColor('#00FF88')
                .setTitle('🗑️ Chat History Cleared')
                .setDescription(`Semua memori percakapan AI telah dihapus!\n**${deletedRows}** entri berhasil dihapus dari database.\nRusdi akan mulai dari awal lagi!`)
                .setFooter({ text: `Cleared by ${interaction.user.username}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('ClearChat Error:', error);
            await interaction.reply({
                content: `❌ Error: ${error.message}`,
                ephemeral: true
            });
        }
    }
};
