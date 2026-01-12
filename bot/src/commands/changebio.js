const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('changebio')
        .setDescription('Ganti bio/about me bot (Admin only)')
        .addStringOption(option =>
            option.setName('bio')
                .setDescription('Teks bio baru untuk bot (kosongkan untuk menghapus bio)')
                .setRequired(false)
                .setMaxLength(190)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const bio = interaction.options.getString('bio');

        await interaction.deferReply({ ephemeral: true });

        try {
            // Update bot's description (which shows as "About Me" in the profile)
            await interaction.client.application.edit({
                description: bio || ''
            });

            if (bio) {
                await interaction.editReply({
                    content: `✅ Bio bot berhasil diganti menjadi:\n> ${bio}`
                });
            } else {
                await interaction.editReply({
                    content: '✅ Bio bot berhasil dihapus!'
                });
            }
        } catch (error) {
            console.error('Error changing bio:', error);

            // Handle rate limit error
            if (error.code === 50035 || error.message?.includes('rate limit')) {
                await interaction.editReply({
                    content: '❌ Terlalu sering ganti bio! Tunggu beberapa menit dan coba lagi.'
                });
            } else if (error.status === 401 || error.code === 50001) {
                await interaction.editReply({
                    content: '❌ Bot tidak memiliki izin untuk mengubah bio.'
                });
            } else {
                await interaction.editReply({
                    content: `❌ Gagal mengganti bio. Error: ${error.message || 'Unknown error'}`
                });
            }
        }
    }
};
