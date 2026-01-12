const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const { sendAuditLog } = require('../utils/auditLogUtils');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member) {
        const guild = member.guild;

        // Wait a bit for audit log to be created
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            // Check if this was a kick (not just a leave)
            const fetchedLogs = await guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MemberKick,
            });
            const kickLog = fetchedLogs.entries.first();

            // Verify this kick log is for this member and recent
            if (!kickLog ||
                kickLog.target?.id !== member.id ||
                kickLog.createdTimestamp < (Date.now() - 10000)) {
                return; // Not a kick, just a leave
            }

            const embed = new EmbedBuilder()
                .setColor('#FF4500')
                .setTitle('👢 Member Kicked')
                .setDescription(`**${member.user.tag}** was kicked from the server`)
                .setAuthor({
                    name: member.user.tag,
                    iconURL: member.user.displayAvatarURL({ size: 32 })
                })
                .addFields(
                    { name: '👤 User', value: `<@${member.id}> (${member.id})`, inline: true },
                    { name: '👮 Kicked by', value: `${kickLog.executor?.tag || 'Unknown'}`, inline: true }
                )
                .setTimestamp();

            if (kickLog.reason) {
                embed.addFields({ name: '📝 Reason', value: kickLog.reason, inline: false });
            }

            await sendAuditLog(guild.id, guild.client, embed);

        } catch (error) {
            // Ignore errors (no audit log permission, etc)
        }
    }
};
