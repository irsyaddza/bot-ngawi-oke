const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getLogic } = require('../utils/logicState');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('logiccheck')
        .setDescription('🧠 Cek logic AI yang lagi dipake')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const currentLogic = getLogic(interaction.guildId);

        const logicInfo = {
            gemini: {
                name: 'Gemini',
                color: '#4285F4',
                emoji: '🔵',
                model: 'gemini-flash-latest',
                provider: 'Google AI'
            },
            grok: {
                name: 'Grok',
                color: '#000000',
                emoji: '🟢',
                model: 'x-ai/grok-4.3',
                provider: 'OpenRouter'
            }
        };

        const info = logicInfo[currentLogic] || logicInfo.gemini;

        const embed = new EmbedBuilder()
            .setColor(info.color)
            .setTitle(`${info.emoji} Current Logic: ${info.name}`)
            .addFields(
                { name: '🤖 Model', value: `\`${info.model}\``, inline: true },
                { name: '🏢 Provider', value: info.provider, inline: true },
                { name: '🏠 Server', value: interaction.guild.name, inline: true }
            )
            .setFooter({ text: 'Use /logic to change' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
