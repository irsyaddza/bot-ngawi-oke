const { Events, EmbedBuilder, AuditLogEvent } = require('discord.js');
const { sendAuditLog } = require('../utils/auditLogUtils');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member) {
        let executor = null;
        let isKick = false;

        // Check if it was a kick
        try {
            const fetchedLogs = await member.guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MemberKick,
            });
            const kickLog = fetchedLogs.entries.first();

            if (kickLog && kickLog.target.id === member.id && kickLog.createdTimestamp > (Date.now() - 5000)) {
                executor = kickLog.executor;
                isKick = true;
            }
        } catch (e) {
            console.error('Failed to fetch audit logs for member remove:', e);
        }

        const embed = new EmbedBuilder()
            .setColor(isKick ? '#FFA500' : '#FF0000') // Orange for kick, Red for leave
            .setTitle(isKick ? '👢 Member Kicked' : '👋 Member Left')
            .setThumbnail(member.user.displayAvatarURL())
            .addFields(
                { name: '👤 User', value: `${member.user.tag} (${member.id})`, inline: true },
                { name: '🗓️ Joined Server', value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown', inline: true }
            )
            .setTimestamp();

        if (isKick && executor) {
            embed.addFields({ name: '👮 Kicked by', value: `${executor.tag}` });
            embed.setFooter({ text: `Kicked by ${executor.tag}`, iconURL: executor.displayAvatarURL() });
        } else {
            embed.setFooter({ text: `User ID: ${member.id}` });
        }

        await sendAuditLog(member.guild, embed);
    }
};
