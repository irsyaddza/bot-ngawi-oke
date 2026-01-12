const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getWeather, formatWeatherMessage, getCoordinates } = require('../utils/weatherService');
const { saveWeatherConfig, getWeatherConfig, disableWeather, sendWeatherUpdate } = require('../utils/weatherScheduler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weather')
        .setDescription('Laporan cuaca dari bot pembawa berita')
        .addSubcommand(subcommand =>
            subcommand
                .setName('now')
                .setDescription('Cek cuaca sekarang')
                .addStringOption(option =>
                    option.setName('wilayah')
                        .setDescription('Nama kota/wilayah (contoh: Jakarta, Ngawi, Surabaya)')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set update cuaca harian ke channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel untuk kirim laporan cuaca')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
                .addStringOption(option =>
                    option.setName('wilayah')
                        .setDescription('Nama kota/wilayah')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('jam')
                        .setDescription('Jam kirim (0-23, default: 6 pagi)')
                        .setMinValue(0)
                        .setMaxValue(23)
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stop')
                .setDescription('Hentikan update cuaca harian')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'now') {
            await interaction.deferReply();

            const wilayah = interaction.options.getString('wilayah');

            try {
                const weather = await getWeather(wilayah);

                if (weather.error) {
                    return interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('Red')
                                .setDescription(`❌ ${weather.error}. Coba nama kota lain.`)
                        ]
                    });
                }

                const message = formatWeatherMessage(weather);

                const embed = new EmbedBuilder()
                    .setColor('#00a8ff')
                    .setDescription(message)
                    .setTimestamp()
                    .setFooter({ text: 'Powered by Open-Meteo' });

                await interaction.editReply({ embeds: [embed] });

            } catch (error) {
                console.error('Weather now error:', error);
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setDescription('❌ Gagal mengambil data cuaca. Coba lagi nanti.')
                    ]
                });
            }
        }

        else if (subcommand === 'set') {
            // Admin only
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({
                    embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ Hanya admin yang bisa mengatur weather update!')],
                    ephemeral: true
                });
            }

            await interaction.deferReply({ ephemeral: true });

            const channel = interaction.options.getChannel('channel');
            const wilayah = interaction.options.getString('wilayah');
            const jam = interaction.options.getInteger('jam') ?? 6;

            try {
                // Validate location exists
                const location = await getCoordinates(wilayah);
                if (!location) {
                    return interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('Red')
                                .setDescription(`❌ Lokasi "${wilayah}" tidak ditemukan. Coba nama kota lain.`)
                        ]
                    });
                }

                // Save config
                saveWeatherConfig(
                    interaction.guildId,
                    channel.id,
                    location.name,
                    location.latitude,
                    location.longitude,
                    jam
                );

                const embed = new EmbedBuilder()
                    .setColor('#00a8ff')
                    .setTitle('✅ Weather Update Configured!')
                    .setDescription(`Laporan cuaca untuk **${location.name}** akan dikirim ke ${channel} setiap hari jam **${jam}:00**.`)
                    .addFields(
                        { name: '📍 Lokasi', value: `${location.name}, ${location.admin || location.country}`, inline: true },
                        { name: '📺 Channel', value: `${channel}`, inline: true },
                        { name: '⏰ Jam Kirim', value: `${jam}:00 WIB`, inline: true }
                    )
                    .setFooter({ text: 'Gunakan /weather stop untuk menghentikan' });

                await interaction.editReply({ embeds: [embed] });

            } catch (error) {
                console.error('Weather set error:', error);
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setDescription('❌ Gagal menyimpan konfigurasi. Coba lagi.')
                    ]
                });
            }
        }

        else if (subcommand === 'stop') {
            // Admin only
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({
                    embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ Hanya admin yang bisa menghentikan weather update!')],
                    ephemeral: true
                });
            }

            const config = getWeatherConfig(interaction.guildId);

            if (!config) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#ffaa00')
                            .setDescription('⚠️ Tidak ada update cuaca yang aktif di server ini.')
                    ],
                    ephemeral: true
                });
            }

            disableWeather(interaction.guildId);

            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#00a8ff')
                        .setDescription(`✅ Update cuaca harian untuk **${config.location}** telah dihentikan.`)
                ],
                ephemeral: true
            });
        }
    }
};
