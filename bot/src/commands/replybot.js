const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('replybot')
        .setDescription('Reply ke pesan tertentu menggunakan bot')
        .addStringOption(option =>
            option.setName('message_link')
                .setDescription('Link pesan yang ingin di-reply (klik kanan pesan → Copy Message Link)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('pesan')
                .setDescription('Pesan reply (opsional jika ada gambar)')
                .setRequired(false)
                .setMaxLength(2000)
        )
        .addAttachmentOption(option =>
            option.setName('gambar')
                .setDescription('Upload gambar untuk dikirim (opsional)')
                .setRequired(false)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const messageLink = interaction.options.getString('message_link');
        const replyContent = interaction.options.getString('pesan');
        const attachment = interaction.options.getAttachment('gambar');

        // Validate that at least one of message or attachment is provided
        if (!replyContent && !attachment) {
            return interaction.reply({
                content: '❌ Harus ada pesan atau gambar yang dikirim!',
                ephemeral: true
            });
        }

        // Parse message link
        // Format: https://discord.com/channels/GUILD_ID/CHANNEL_ID/MESSAGE_ID
        const linkRegex = /https:\/\/(?:ptb\.|canary\.)?discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/;
        const match = messageLink.match(linkRegex);

        if (!match) {
            return interaction.reply({
                content: '❌ Link pesan tidak valid! Gunakan format: https://discord.com/channels/.../...',
                ephemeral: true
            });
        }

        const [, guildId, channelId, messageId] = match;

        // Validate guild
        if (guildId !== interaction.guildId) {
            return interaction.reply({
                content: '❌ Link pesan harus dari server yang sama!',
                ephemeral: true
            });
        }

        // Defer reply to prevent timeout when fetching message and uploading
        await interaction.deferReply({ ephemeral: true });

        try {
            // Get the channel
            const channel = await interaction.client.channels.fetch(channelId);
            if (!channel) {
                return interaction.editReply({
                    content: '❌ Channel tidak ditemukan!'
                });
            }

            // Get the message
            const targetMessage = await channel.messages.fetch(messageId);
            if (!targetMessage) {
                return interaction.editReply({
                    content: '❌ Pesan tidak ditemukan!'
                });
            }

            // Build reply payload
            const replyPayload = {
                allowedMentions: {
                    parse: ['users', 'roles'],
                    repliedUser: true
                }
            };

            if (replyContent) replyPayload.content = replyContent;
            if (attachment) replyPayload.files = [attachment.url];

            // Send the reply
            await targetMessage.reply(replyPayload);

            await interaction.editReply({
                content: `✅ Reply berhasil dikirim ke pesan di ${channel}!`
            });

        } catch (error) {
            console.error('Replybot error:', error);

            let errorMessage = '❌ Gagal mengirim reply.';
            if (error.code === 10008) {
                errorMessage = '❌ Pesan tidak ditemukan! Mungkin sudah dihapus.';
            } else if (error.code === 50001) {
                errorMessage = '❌ Bot tidak memiliki akses ke channel tersebut!';
            } else if (error.code === 50013) {
                errorMessage = '❌ Bot tidak memiliki izin untuk mengirim pesan di channel tersebut!';
            }

            await interaction.editReply({
                content: errorMessage
            });
        }
    }
};
