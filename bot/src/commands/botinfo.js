const { SlashCommandBuilder, EmbedBuilder, version: djsVersion } = require('discord.js');
const os = require('os');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription('📊 Informasi tentang bot'),

    async execute(interaction) {
        const client = interaction.client;

        // Calculate uptime
        const uptime = formatUptime(client.uptime);

        // Calculate memory usage
        const memUsage = process.memoryUsage();
        const memUsedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
        const memTotalMB = (memUsage.heapTotal / 1024 / 1024).toFixed(2);

        // Count stats
        const totalGuilds = client.guilds.cache.size;
        const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const totalChannels = client.channels.cache.size;

        // Get bot info
        const botUser = client.user;

        const embed = new EmbedBuilder()
            .setColor('#a200ff')
            .setTitle(`📊 ${botUser.username} Info`)
            .setThumbnail(botUser.displayAvatarURL({ size: 256 }))
            .addFields(
                {
                    name: '🌐 Servers',
                    value: `\`${totalGuilds}\``,
                    inline: true
                },
                {
                    name: '👥 Users',
                    value: `\`${totalUsers.toLocaleString()}\``,
                    inline: true
                },
                {
                    name: '📺 Channels',
                    value: `\`${totalChannels.toLocaleString()}\``,
                    inline: true
                },
                {
                    name: '⏰ Uptime',
                    value: `\`${uptime}\``,
                    inline: true
                },
                {
                    name: '💾 Memory',
                    value: `\`${memUsedMB}/${memTotalMB} MB\``,
                    inline: true
                },
                {
                    name: '🏓 Ping',
                    value: `\`${client.ws.ping}ms\``,
                    inline: true
                },
                {
                    name: '📦 Discord.js',
                    value: `\`v${djsVersion}\``,
                    inline: true
                },
                {
                    name: '🟢 Node.js',
                    value: `\`${process.version}\``,
                    inline: true
                },
                {
                    name: '💻 Platform',
                    value: `\`${os.platform()} ${os.arch()}\``,
                    inline: true
                }
            )
            .setFooter({
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        // Add server list if small number of servers
        if (totalGuilds <= 10 && totalGuilds > 1) {
            const serverList = client.guilds.cache
                .sort((a, b) => b.memberCount - a.memberCount)
                .map(g => `• ${g.name} (${g.memberCount})`)
                .join('\n');
            embed.addFields({
                name: '🏠 Server List',
                value: serverList || 'None',
                inline: false
            });
        }

        await interaction.reply({ embeds: [embed] });
    }
};

// Helper function to format uptime
function formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours % 24 > 0) parts.push(`${hours % 24}h`);
    if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);
    if (seconds % 60 > 0 || parts.length === 0) parts.push(`${seconds % 60}s`);

    return parts.join(' ');
}
