const { Events, EmbedBuilder } = require('discord.js');
const { sendAuditLog } = require('../utils/auditLogUtils');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        const createdTimestamp = Math.floor(member.user.createdTimestamp / 1000);

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('👋 Member Joined')
            .setThumbnail(member.user.displayAvatarURL())
            .addFields(
                { name: '👤 User', value: `<@${member.id}> (${member.user.tag})`, inline: true },
                { name: '📅 Account Created', value: `<t:${createdTimestamp}:R>`, inline: true },
                { name: '🔢 Member Count', value: `${member.guild.memberCount}`, inline: true }
            )
            .setFooter({ text: `User ID: ${member.id}` })
            .setTimestamp();

        await sendAuditLog(member.guild, embed);
    }
};
