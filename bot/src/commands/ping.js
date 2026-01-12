const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('🏓 Cek latency bot'),

    async execute(interaction) {
        const sent = await interaction.reply({ content: '🏓 Pinging...', fetchReply: true });

        const latency = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);

        const embed = new EmbedBuilder()
            .setColor('#00ff88')
            .setTitle('🏓 Pong!')
            .addFields(
                { name: '📡 Bot Latency', value: `\`${latency}ms\``, inline: true },
                { name: '💓 API Latency', value: `\`${apiLatency}ms\``, inline: true }
            )
            .setFooter({ text: `Requested by ${interaction.user.username}` })
            .setTimestamp();

        await interaction.editReply({ content: null, embeds: [embed] });
    }
};
