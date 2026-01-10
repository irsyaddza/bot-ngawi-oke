const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const { sendAuditLog } = require('../utils/auditLogUtils');

module.exports = {
    name: 'guildBanAdd',
    async execute(ban) {
        const guild = ban.guild;
        const user = ban.user;

        // Wait a bit for audit log to be created
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            const fetchedLogs = await guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MemberBanAdd,
            });
            const banLog = fetchedLogs.entries.first();

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🔨 Member Banned')
                .setDescription(`**${user.tag}** was banned from the server`)
                .setAuthor({
                    name: user.tag,
                    iconURL: user.displayAvatarURL({ size: 32 })
                })
                .addFields(
                    { name: '👤 User', value: `<@${user.id}> (${user.id})`, inline: true }
                )
                .setTimestamp();

            // Add moderator if found
            if (banLog && banLog.target?.id === user.id && banLog.createdTimestamp > (Date.now() - 10000)) {
                embed.addFields({ name: '👮 Banned by', value: `${banLog.executor?.tag || 'Unknown'}`, inline: true });

                if (banLog.reason) {
                    embed.addFields({ name: '📝 Reason', value: banLog.reason, inline: false });
                }
            }

            await sendAuditLog(guild.id, guild.client, embed);

        } catch (error) {
            // Ignore errors
        }
    }
};
