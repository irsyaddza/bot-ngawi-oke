const { EmbedBuilder, AuditLogEvent } = require('discord.js');

module.exports = {
    name: 'messageDelete',
    async execute(message) {
        // Ignore bot messages and DMs
        if (!message.guild || message.author?.bot) return;

        // Ignore empty/partial messages
        if (!message.content && !message.attachments.size) return;

        try {
            // Get bot owner
            const application = await message.client.application.fetch();
            const owner = application.owner;

            if (!owner) return;

            // Try to find who deleted (from audit logs)
            let executor = null;
            try {
                const fetchedLogs = await message.guild.fetchAuditLogs({
                    limit: 1,
                    type: AuditLogEvent.MessageDelete,
                });
                const deleteLog = fetchedLogs.entries.first();

                if (deleteLog &&
                    deleteLog.target.id === message.author?.id &&
                    deleteLog.createdTimestamp > (Date.now() - 5000)) {
                    executor = deleteLog.executor;
                }
            } catch (e) {
                // No audit log access
            }

            // Build embed
            const embed = new EmbedBuilder()
                .setColor('#FF4444')
                .setTitle('🗑️ Pesan Dihapus')
                .setDescription(`**Server:** ${message.guild.name}`)
                .addFields(
                    { name: '👤 Author', value: `${message.author?.tag || 'Unknown'} (<@${message.author?.id}>)`, inline: true },
                    { name: '📍 Channel', value: `<#${message.channelId}>`, inline: true }
                )
                .setTimestamp();

            // Add executor if found
            if (executor && executor.id !== message.author?.id) {
                embed.addFields({ name: '🔨 Dihapus oleh', value: `${executor.tag}`, inline: true });
            }

            // Add message content
            if (message.content) {
                const content = message.content.length > 1000
                    ? message.content.substring(0, 1000) + '...'
                    : message.content;
                embed.addFields({ name: '📝 Pesan', value: `\`\`\`${content}\`\`\`` });
            }

            // Add attachments if any
            if (message.attachments.size > 0) {
                const attachmentList = message.attachments.map(a => a.url).join('\n');
                embed.addFields({ name: '📎 Attachments', value: attachmentList.substring(0, 1000) });
            }

            embed.setFooter({ text: `Message ID: ${message.id}` });

            // DM to owner
            await owner.send({ embeds: [embed] });

        } catch (error) {
            // Silently fail if can't DM owner
            if (error.code !== 50007) { // 50007 = Cannot send messages to this user
                console.error('[MessageDelete Log] Error:', error.message);
            }
        }
    }
};
