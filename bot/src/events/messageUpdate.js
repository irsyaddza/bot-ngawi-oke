const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'messageUpdate',
    async execute(oldMessage, newMessage) {
        // Ignore bot messages and DMs
        if (!newMessage.guild || newMessage.author?.bot) return;

        // Ignore if content is the same (embed update, etc)
        if (oldMessage.content === newMessage.content) return;

        // Ignore partial messages without content
        if (!oldMessage.content || !newMessage.content) return;

        try {
            // Get bot owner
            const application = await newMessage.client.application.fetch();
            const owner = application.owner;

            if (!owner) return;

            // Build embed
            const embed = new EmbedBuilder()
                .setColor('#FFAA00')
                .setTitle('✏️ Pesan Diedit')
                .setDescription(`**Server:** ${newMessage.guild.name}`)
                .addFields(
                    { name: '👤 Author', value: `${newMessage.author.tag} (<@${newMessage.author.id}>)`, inline: true },
                    { name: '📍 Channel', value: `<#${newMessage.channelId}>`, inline: true },
                    { name: '🔗 Link', value: `[Jump to Message](${newMessage.url})`, inline: true }
                )
                .setTimestamp();

            // Add before content
            const beforeContent = oldMessage.content.length > 500
                ? oldMessage.content.substring(0, 500) + '...'
                : oldMessage.content;
            embed.addFields({ name: '📝 Sebelum', value: `\`\`\`${beforeContent}\`\`\`` });

            // Add after content
            const afterContent = newMessage.content.length > 500
                ? newMessage.content.substring(0, 500) + '...'
                : newMessage.content;
            embed.addFields({ name: '📝 Sesudah', value: `\`\`\`${afterContent}\`\`\`` });

            embed.setFooter({ text: `Message ID: ${newMessage.id}` });

            // DM to owner
            await owner.send({ embeds: [embed] });

        } catch (error) {
            // Silently fail if can't DM owner
            if (error.code !== 50007) { // 50007 = Cannot send messages to this user
                console.error('[MessageUpdate Log] Error:', error.message);
            }
        }
    }
};
