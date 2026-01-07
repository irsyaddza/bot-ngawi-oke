const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giverole')
        .setDescription('Berikan role ke user tertentu')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('Pilih user yang akan diberikan role')
                .setRequired(true)
        )
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Pilih role yang akan diberikan')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('target');
        const role = interaction.options.getRole('role');
        const member = await interaction.guild.members.fetch(targetUser.id);

        // Check if bot's highest role is higher than the role to give
        const botMember = await interaction.guild.members.fetch(interaction.client.user.id);
        if (botMember.roles.highest.position <= role.position) {
            return interaction.reply({
                content: `❌ Bot tidak bisa memberikan role **${role.name}** karena posisi role tersebut lebih tinggi atau sama dengan role tertinggi bot!`,
                ephemeral: true
            });
        }

        // Check if user already has the role
        if (member.roles.cache.has(role.id)) {
            return interaction.reply({
                content: `⚠️ ${targetUser} sudah memiliki role **${role.name}**!`,
                ephemeral: true
            });
        }

        // Check if the role is @everyone or managed
        if (role.managed || role.id === interaction.guild.id) {
            return interaction.reply({
                content: `❌ Role **${role.name}** tidak bisa diberikan secara manual!`,
                ephemeral: true
            });
        }

        try {
            await member.roles.add(role);

            await interaction.reply({
                content: `✅ Berhasil memberikan role **${role.name}** ke ${targetUser}!`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Give role error:', error);
            await interaction.reply({
                content: '❌ Gagal memberikan role. Pastikan bot memiliki izin yang diperlukan.',
                ephemeral: true
            });
        }
    }
};
