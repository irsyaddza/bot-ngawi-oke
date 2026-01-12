const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setLogChannel, disableLog, getLogChannelId } = require('../utils/auditLogUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('auditlog')
        .setDescription('📋 Configure Audit Log')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(subcommand =>
            subcommand
                .setName('enable')
                .setDescription('Enable audit log in a specific channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel for audit logs')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Disable audit log')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Check audit log status')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'enable') {
            const channel = interaction.options.getChannel('channel');

            setLogChannel(interaction.guildId, channel.id);

            const embed = new EmbedBuilder()
                .setColor('#00FF88')
                .setTitle('✅ Audit Log Enabled')
                .setDescription(`Audit logs will be sent to <#${channel.id}>`)
                .setFooter({ text: `Configured by ${interaction.user.username}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } else if (subcommand === 'disable') {
            const isDisabling = disableLog(interaction.guildId);

            if (!isDisabling) {
                return interaction.reply({
                    content: '❌ Audit log is already disabled.',
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setColor('#FF5555')
                .setTitle('🛑 Audit Log Disabled')
                .setDescription('Audit logging has been turned off.')
                .setFooter({ text: `Configured by ${interaction.user.username}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } else if (subcommand === 'status') {
            const channelId = getLogChannelId(interaction.guildId);

            const embed = new EmbedBuilder()
                .setColor('#FFAA00')
                .setTitle('📋 Audit Log Status')
                .addFields(
                    { name: 'Status', value: channelId ? '✅ Enabled' : '❌ Disabled', inline: true },
                    { name: 'Channel', value: channelId ? `<#${channelId}>` : 'None', inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};
