const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getAllWeatherConfigsRaw, disableWeather, disableWeatherByLocation } = require('../utils/weatherScheduler');
const config = require('../config');

// Helper to check if user is bot owner or has admin permissions
const isAuthorized = (interaction) => {
    return interaction.user.id === config.ownerId || interaction.member.permissions.has(PermissionFlagsBits.Administrator);
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weather-admin')
        .setDescription('Admin commands for Weather System')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all active weather configurations (Admin only)')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove weather configuration by location name')
                .addStringOption(option =>
                    option.setName('location')
                        .setDescription('The location name to remove weather config for (partial match supported)')
                        .setRequired(true)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Discord built-in permission check

    async execute(interaction) {
        // Double check for safety, though setDefaultMemberPermissions handles it for guild integrations
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '❌ You do not have permission to use this command.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'list') {
            const configs = getAllWeatherConfigsRaw(); // Fetch ALL (active + disabled)

            if (configs.length === 0) {
                return interaction.reply({ content: 'ℹ️ No active weather configurations found.', ephemeral: true });
            }

            const embed = new EmbedBuilder()
                .setTitle('🌤️ Active Weather Configurations')
                .setColor('#FF9F43')
                .setTimestamp();

            // Format list 
            const fields = configs.slice(0, 20).map(conf => {
                const status = conf.enabled ? '✅' : '❌';
                return {
                    name: `${status} ${conf.guild_id}`,
                    value: `Channel: <#${conf.channel_id}> | **Location: ${conf.location}** | Hour: ${conf.send_hour}:00`,
                    inline: false
                };
            });

            embed.addFields(fields);

            if (configs.length > 20) {
                embed.setFooter({ text: `Showing 20 of ${configs.length} configs` });
            } else {
                embed.setFooter({ text: `Total: ${configs.length} configs` });
            }

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } else if (subcommand === 'remove') {
            const locationQuery = interaction.options.getString('location');

            try {
                const result = disableWeatherByLocation(locationQuery);

                if (result.changes > 0) {
                    await interaction.reply({ content: `✅ Successfully removed weather config(s) matching location: \`${locationQuery}\`\n(Affected ${result.changes} servers)`, ephemeral: true });
                } else {
                    await interaction.reply({ content: `⚠️ No active weather config found matching location: \`${locationQuery}\`.`, ephemeral: true });
                }
            } catch (error) {
                console.error('[WeatherAdmin] Error removing config:', error);
                await interaction.reply({ content: '❌ Failed to remove weather config due to a database error.', ephemeral: true });
            }
        }
    },
};
