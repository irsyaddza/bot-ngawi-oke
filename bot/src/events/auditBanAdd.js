const { Events, EmbedBuilder, AuditLogEvent } = require('discord.js');
const { sendAuditLog } = require('../utils/auditLogUtils');

module.exports = {
    name: Events.GuildBanAdd,
    async execute(ban) {
        let executor = null;
        let reason = 'No reason provided';

        try {
            const fetchedLogs = await ban.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MemberBanAdd,
            });
            const banLog = fetchedLogs.entries.first();

            if (banLog && banLog.target.id === ban.user.id) {
                executor = banLog.executor;
                if (banLog.reason) reason = banLog.reason;
            }
        } catch (e) {
            console.error('Failed to fetch audit logs for ban:', e);
        }

        const embed = new EmbedBuilder()
            .setColor('#8B0000') // Dark Red
            .setTitle('🔨 Member Banned')
            .setThumbnail(ban.user.displayAvatarURL())
            .addFields(
                { name: '👤 User', value: `${ban.user.tag} (${ban.user.id})`, inline: true },
                { name: '👮 Moderator', value: executor ? executor.tag : 'Unknown', inline: true },
                { name: '📝 Reason', value: reason }
            )
            .setTimestamp();

        if (executor) {
            embed.setFooter({ text: `Banned by ${executor.tag}`, iconURL: executor.displayAvatarURL() });
        }

        await sendAuditLog(ban.guild, embed);
    }
};
