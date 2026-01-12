const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('changepfp')
        .setDescription('Ganti foto profil bot (Admin only)')
        .addAttachmentOption(option =>
            option.setName('gambar')
                .setDescription('Upload gambar untuk foto profil bot')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const attachment = interaction.options.getAttachment('gambar');

        // Validate file type
        const validTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
        if (!validTypes.includes(attachment.contentType)) {
            return interaction.reply({
                content: '❌ File harus berupa gambar (PNG, JPG, GIF, atau WEBP)!',
                ephemeral: true
            });
        }

        // Check file size (max 8MB for Discord)
        if (attachment.size > 8 * 1024 * 1024) {
            return interaction.reply({
                content: '❌ Ukuran file terlalu besar! Maksimal 8MB.',
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            // Change bot avatar
            await interaction.client.user.setAvatar(attachment.url);

            await interaction.editReply({
                content: `✅ Foto profil bot berhasil diganti!`
            });
        } catch (error) {
            console.error('Error changing avatar:', error);

            // Handle rate limit error
            if (error.code === 50035 || error.message.includes('rate limit')) {
                await interaction.editReply({
                    content: '❌ Terlalu sering ganti foto! Tunggu beberapa menit dan coba lagi.'
                });
            } else {
                await interaction.editReply({
                    content: '❌ Gagal mengganti foto profil. Silakan coba lagi.'
                });
            }
        }
    }
};
