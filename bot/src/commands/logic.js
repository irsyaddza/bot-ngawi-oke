const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getLogic, setLogic, getValidLogics } = require('../utils/logicState');
const { updateLogicActivity } = require('../events/ready');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('logic')
        .setDescription('🧠 Ganti otak AI bot (Gemini/Grok)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(option =>
            option.setName('model')
                .setDescription('Pilih model AI')
                .setRequired(true)
                .addChoices(
                    { name: '🔵 Gemini (Google)', value: 'gemini' },
                    { name: '🟢 Grok (OpenRouter)', value: 'grok' }
                )
        ),

    async execute(interaction) {
        const selectedLogic = interaction.options.getString('model');
        const currentLogic = getLogic(interaction.guildId);

        // Set new logic
        setLogic(interaction.guildId, selectedLogic);

        // Update bot activity
        updateLogicActivity(interaction.client, selectedLogic);

        const logicInfo = {
            gemini: {
                name: 'Gemini',
                color: '#4285F4',
                emoji: '🔵',
                desc: 'Google Gemini AI - Model default'
            },
            grok: {
                name: 'Grok',
                color: '#000000',
                emoji: '🟢',
                desc: 'Grok 4.3 via OpenRouter'
            }
        };

        const info = logicInfo[selectedLogic];

        const embed = new EmbedBuilder()
            .setColor(info.color)
            .setTitle(`${info.emoji} Logic Changed: ${info.name}`)
            .setDescription(info.desc)
            .addFields(
                { name: 'Sebelumnya', value: logicInfo[currentLogic].name, inline: true },
                { name: 'Sekarang', value: info.name, inline: true }
            )
            .setFooter({ text: `Server: ${interaction.guild.name}` });

        await interaction.reply({ embeds: [embed] });
    }
};
