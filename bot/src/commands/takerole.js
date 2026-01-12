const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('takerole')
        .setDescription('Hapus role dari user tertentu')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('Pilih user yang akan dihapus role-nya')
                .setRequired(true)
        )
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Pilih role yang akan dihapus')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('target');
        const role = interaction.options.getRole('role');
        const member = await interaction.guild.members.fetch(targetUser.id);

        // Check if bot's highest role is higher than the role to remove
        const botMember = await interaction.guild.members.fetch(interaction.client.user.id);
        if (botMember.roles.highest.position <= role.position) {
            return interaction.reply({
                content: `❌ Bot tidak bisa menghapus role **${role.name}** karena posisi role tersebut lebih tinggi atau sama dengan role tertinggi bot!`,
                ephemeral: true
            });
        }

        // Check if user doesn't have the role
        if (!member.roles.cache.has(role.id)) {
            return interaction.reply({
                content: `⚠️ ${targetUser} tidak memiliki role **${role.name}**!`,
                ephemeral: true
            });
        }

        // Check if the role is @everyone or managed
        if (role.managed || role.id === interaction.guild.id) {
            return interaction.reply({
                content: `❌ Role **${role.name}** tidak bisa dihapus secara manual!`,
                ephemeral: true
            });
        }

        try {
            await member.roles.remove(role);

            await interaction.reply({
                content: `✅ Berhasil menghapus role **${role.name}** dari ${targetUser}!`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Take role error:', error);
            await interaction.reply({
                content: '❌ Gagal menghapus role. Pastikan bot memiliki izin yang diperlukan.',
                ephemeral: true
            });
        }
    }
};
