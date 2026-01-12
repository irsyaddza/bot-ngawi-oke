const { Events, EmbedBuilder, AuditLogEvent } = require('discord.js');
const { sendAuditLog } = require('../utils/auditLogUtils');

module.exports = {
    name: Events.GuildBanRemove,
    async execute(ban) {
        let executor = null;

        try {
            const fetchedLogs = await ban.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MemberBanRemove,
            });
            const unbanLog = fetchedLogs.entries.first();

            if (unbanLog && unbanLog.target.id === ban.user.id) {
                executor = unbanLog.executor;
            }
        } catch (e) {
            console.error('Failed to fetch audit logs for unban:', e);
        }

        const embed = new EmbedBuilder()
            .setColor('#00FFFF') // Aqua
            .setTitle('🔓 Member Unbanned')
            .addFields(
                { name: '👤 User', value: `${ban.user.tag} (${ban.user.id})`, inline: true },
                { name: '👮 Moderator', value: executor ? executor.tag : 'Unknown', inline: true }
            )
            .setTimestamp();

        if (executor) {
            embed.setFooter({ text: `Unbanned by ${executor.tag}`, iconURL: executor.displayAvatarURL() });
        }

        await sendAuditLog(ban.guild, embed);
    }
};
