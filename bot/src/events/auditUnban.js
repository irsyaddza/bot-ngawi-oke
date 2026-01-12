const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const { sendAuditLog } = require('../utils/auditLogUtils');

module.exports = {
    name: 'guildBanRemove',
    async execute(ban) {
        const guild = ban.guild;
        const user = ban.user;

        // Wait a bit for audit log to be created
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            const fetchedLogs = await guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MemberBanRemove,
            });
            const unbanLog = fetchedLogs.entries.first();

            const embed = new EmbedBuilder()
                .setColor('#00FF88')
                .setTitle('🔓 Member Unbanned')
                .setDescription(`**${user.tag}** was unbanned from the server`)
                .setAuthor({
                    name: user.tag,
                    iconURL: user.displayAvatarURL({ size: 32 })
                })
                .addFields(
                    { name: '👤 User', value: `<@${user.id}> (${user.id})`, inline: true }
                )
                .setTimestamp();

            // Add moderator if found
            if (unbanLog && unbanLog.target?.id === user.id && unbanLog.createdTimestamp > (Date.now() - 10000)) {
                embed.addFields({ name: '👮 Unbanned by', value: `${unbanLog.executor?.tag || 'Unknown'}`, inline: true });
            }

            await sendAuditLog(guild.id, guild.client, embed);

        } catch (error) {
            // Ignore errors
        }
    }
};
