const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('send')
        .setDescription('Kirim pesan ke channel tertentu')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Pilih channel tujuan pengiriman pesan')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        )
        .addStringOption(option =>
            option.setName('pesan')
                .setDescription('Pesan yang ingin dikirim (bisa @mention user atau #channel)')
                .setRequired(true)
                .setMaxLength(2000)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const targetChannel = interaction.options.getChannel('channel');
        const message = interaction.options.getString('pesan');

        // Check if bot has permission to send messages in target channel
        const botPermissions = targetChannel.permissionsFor(interaction.client.user);
        if (!botPermissions.has(PermissionFlagsBits.SendMessages)) {
            return interaction.reply({
                content: `❌ Bot tidak memiliki izin untuk mengirim pesan ke ${targetChannel}!`,
                ephemeral: true
            });
        }

        try {
            // Send the message to target channel
            // Discord automatically parses @mentions and #channels from the string
            await targetChannel.send({
                content: message,
                allowedMentions: {
                    parse: ['users', 'roles'],
                    repliedUser: false
                }
            });

            await interaction.reply({
                content: `✅ Pesan berhasil dikirim ke ${targetChannel}!`,
                ephemeral: true
            });

        } catch (error) {
            console.error('Send message error:', error);
            await interaction.reply({
                content: '❌ Gagal mengirim pesan. Pastikan bot memiliki izin yang diperlukan.',
                ephemeral: true
            });
        }
    }
};
