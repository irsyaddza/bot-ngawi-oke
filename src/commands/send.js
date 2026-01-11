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
                .setRequired(false)
                .setMaxLength(2000)
        )
        .addAttachmentOption(option =>
            option.setName('gambar')
                .setDescription('Upload gambar untuk dikirim bersama pesan')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const targetChannel = interaction.options.getChannel('channel');
        const message = interaction.options.getString('pesan');
        const attachment = interaction.options.getAttachment('gambar');

        // Check if at least message or attachment is provided
        if (!message && !attachment) {
            return interaction.reply({
                content: '❌ Harus ada pesan atau gambar yang dikirim!',
                ephemeral: true
            });
        }

        // Check if bot has permission to send messages in target channel
        const botPermissions = targetChannel.permissionsFor(interaction.client.user);
        if (!botPermissions.has(PermissionFlagsBits.SendMessages)) {
            return interaction.reply({
                content: `❌ Bot tidak memiliki izin untuk mengirim pesan ke ${targetChannel}!`,
                ephemeral: true
            });
        }

        // Check AttachFiles permission if sending attachment
        if (attachment && !botPermissions.has(PermissionFlagsBits.AttachFiles)) {
            return interaction.reply({
                content: `❌ Bot tidak memiliki izin untuk mengirim file ke ${targetChannel}!`,
                ephemeral: true
            });
        }

        try {
            // Build message payload
            const messagePayload = {
                allowedMentions: {
                    parse: ['users', 'roles'],
                    repliedUser: false
                }
            };

            if (message) messagePayload.content = message;
            if (attachment) messagePayload.files = [attachment.url];

            // Send the message to target channel
            await targetChannel.send(messagePayload);

            await interaction.reply({
                content: `✅ ${attachment ? 'Pesan + gambar' : 'Pesan'} berhasil dikirim ke ${targetChannel}!`,
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
