const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { saveAnalyticsConfig, getAnalyticsConfig, disableAnalytics, getUserStats, getWeeklyMessageStats, getWeeklyVoiceStats, seedDummyData, clearAnalyticsData, getDataCounts } = require('../utils/analyticsDB');
const { generateWeeklyReport, formatDuration } = require('../utils/analyticsReport');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('analytics')
        .setDescription('Server analytics dan weekly report')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Setup weekly report ke channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel untuk kirim weekly report')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                )
                .addIntegerOption(option =>
                    option.setName('hari')
                        .setDescription('Hari kirim report (0=Minggu, 1=Senin, dst)')
                        .setMinValue(0)
                        .setMaxValue(6)
                        .setRequired(false)
                )
                .addIntegerOption(option =>
                    option.setName('jam')
                        .setDescription('Jam kirim (0-23, default: 9 pagi)')
                        .setMinValue(0)
                        .setMaxValue(23)
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('Lihat statistik pribadi minggu ini')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription('Lihat top 10 member paling aktif')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('report')
                .setDescription('Generate weekly report sekarang (Admin)')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stop')
                .setDescription('Stop weekly report')
        )
        .addSubcommandGroup(group =>
            group
                .setName('test')
                .setDescription('Testing commands (Admin only)')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('seed')
                        .setDescription('Generate dummy data untuk testing')
                        .addIntegerOption(option =>
                            option.setName('users')
                                .setDescription('Jumlah user dummy (default: 10)')
                                .setMinValue(1)
                                .setMaxValue(50)
                                .setRequired(false)
                        )
                        .addIntegerOption(option =>
                            option.setName('days')
                                .setDescription('Jumlah hari data (default: 7)')
                                .setMinValue(1)
                                .setMaxValue(30)
                                .setRequired(false)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('clear')
                        .setDescription('Hapus SEMUA data analytics')
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('preview')
                        .setDescription('Preview report tanpa post ke channel')
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const subcommandGroup = interaction.options.getSubcommandGroup();

        // ============ SETUP ============
        if (subcommand === 'setup') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({
                    embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ Hanya admin yang bisa setup analytics!')],
                    ephemeral: true
                });
            }

            const channel = interaction.options.getChannel('channel');
            const hari = interaction.options.getInteger('hari') ?? 0;
            const jam = interaction.options.getInteger('jam') ?? 9;

            const hariNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

            try {
                saveAnalyticsConfig(interaction.guildId, channel.id, hari, jam);

                const embed = new EmbedBuilder()
                    .setColor('#00a8ff')
                    .setTitle('✅ Analytics Setup Complete!')
                    .setDescription(`Weekly report akan dikirim ke ${channel} setiap **${hariNames[hari]}** jam **${jam}:00**.`)
                    .addFields(
                        { name: '📊 Tracking', value: '• Messages ✅\n• Voice Hours ✅', inline: true },
                        { name: '📅 Schedule', value: `${hariNames[hari]} ${jam}:00 WIB`, inline: true }
                    )
                    .setFooter({ text: 'Gunakan /analytics stop untuk menghentikan' });

                await interaction.reply({ embeds: [embed] });
            } catch (error) {
                console.error('Analytics setup error:', error);
                await interaction.reply({
                    embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ Gagal setup analytics.')],
                    ephemeral: true
                });
            }
        }

        // ============ STATS ============
        else if (subcommand === 'stats') {
            await interaction.deferReply();

            try {
                const stats = getUserStats(interaction.guildId, interaction.user.id);

                const embed = new EmbedBuilder()
                    .setColor('#00a8ff')
                    .setTitle(`📊 Stats Minggu Ini`)
                    .setDescription(`Stats untuk ${interaction.user}`)
                    .addFields(
                        { name: '💬 Messages', value: `${stats.messages.toLocaleString()}`, inline: true },
                        { name: '🎙️ Voice Time', value: formatDuration(stats.voiceSeconds), inline: true }
                    )
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.error('Analytics stats error:', error);
                await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ Gagal ambil stats.')]
                });
            }
        }

        // ============ LEADERBOARD ============
        else if (subcommand === 'leaderboard') {
            await interaction.deferReply();

            try {
                const messageStats = getWeeklyMessageStats(interaction.guildId);
                const voiceStats = getWeeklyVoiceStats(interaction.guildId);

                // Merge stats
                const memberMap = new Map();
                for (const m of messageStats) {
                    memberMap.set(m.user_id, { user_id: m.user_id, messages: m.message_count, voice: 0 });
                }
                for (const v of voiceStats) {
                    if (memberMap.has(v.user_id)) {
                        memberMap.get(v.user_id).voice = v.total_seconds;
                    } else {
                        memberMap.set(v.user_id, { user_id: v.user_id, messages: 0, voice: v.total_seconds });
                    }
                }

                const sorted = Array.from(memberMap.values())
                    .sort((a, b) => (b.messages + b.voice / 60) - (a.messages + a.voice / 60))
                    .slice(0, 10);

                if (sorted.length === 0) {
                    return interaction.editReply({
                        embeds: [new EmbedBuilder().setColor('#ffaa00').setDescription('📊 Belum ada data minggu ini.')]
                    });
                }

                const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
                let leaderboard = '';
                for (let i = 0; i < sorted.length; i++) {
                    const m = sorted[i];
                    leaderboard += `${medals[i]} <@${m.user_id}> • ${m.messages} msg • ${formatDuration(m.voice)}\n`;
                }

                const embed = new EmbedBuilder()
                    .setColor('#00a8ff')
                    .setTitle('🏆 Leaderboard Minggu Ini')
                    .setDescription(leaderboard)
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.error('Analytics leaderboard error:', error);
                await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ Gagal ambil leaderboard.')]
                });
            }
        }

        // ============ REPORT (Manual) ============
        else if (subcommand === 'report') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({
                    embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ Hanya admin yang bisa generate report!')],
                    ephemeral: true
                });
            }

            await interaction.deferReply();

            try {
                const embed = await generateWeeklyReport(interaction.client, interaction.guildId);
                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.error('Analytics report error:', error);
                await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ Gagal generate report.')]
                });
            }
        }

        // ============ STOP ============
        else if (subcommand === 'stop') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                return interaction.reply({
                    embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ Hanya admin yang bisa stop analytics!')],
                    ephemeral: true
                });
            }

            const config = getAnalyticsConfig(interaction.guildId);
            if (!config) {
                return interaction.reply({
                    embeds: [new EmbedBuilder().setColor('#ffaa00').setDescription('⚠️ Analytics belum di-setup di server ini.')],
                    ephemeral: true
                });
            }

            disableAnalytics(interaction.guildId);

            await interaction.reply({
                embeds: [new EmbedBuilder().setColor('#00a8ff').setDescription('✅ Weekly report telah dihentikan.')],
                ephemeral: true
            });
        }

        // ============ TEST SEED ============
        else if (subcommandGroup === 'test' && subcommand === 'seed') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({
                    embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ Hanya Administrator yang bisa menggunakan test commands!')],
                    ephemeral: true
                });
            }

            await interaction.deferReply({ ephemeral: true });

            const users = interaction.options.getInteger('users') ?? 10;
            const days = interaction.options.getInteger('days') ?? 7;

            try {
                // Get some real member IDs from the guild for more realistic data
                const members = await interaction.guild.members.fetch({ limit: users });
                const realUserIds = members.filter(m => !m.user.bot).map(m => m.id).slice(0, users);

                const result = seedDummyData(interaction.guildId, users, days, realUserIds);

                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('🧪 Test Data Generated!')
                    .setDescription(`Dummy data berhasil dibuat.`)
                    .addFields(
                        { name: '👥 Users', value: `${result.users}`, inline: true },
                        { name: '📅 Days', value: `${result.days}`, inline: true },
                        { name: '💬 Messages', value: `${result.messages.toLocaleString()}`, inline: true },
                        { name: '🎙️ Voice Sessions', value: `${result.voiceSessions.toLocaleString()}`, inline: true }
                    )
                    .setFooter({ text: 'Gunakan /analytics test clear untuk menghapus' });

                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.error('Analytics test seed error:', error);
                await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor('Red').setDescription(`❌ Gagal generate test data: ${error.message}`)]
                });
            }
        }

        // ============ TEST CLEAR ============
        else if (subcommandGroup === 'test' && subcommand === 'clear') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({
                    embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ Hanya Administrator yang bisa menggunakan test commands!')],
                    ephemeral: true
                });
            }

            // Get current counts for confirmation
            const counts = getDataCounts(interaction.guildId);

            if (counts.messages === 0 && counts.voiceSessions === 0) {
                return interaction.reply({
                    embeds: [new EmbedBuilder().setColor('#ffaa00').setDescription('⚠️ Tidak ada data untuk dihapus.')],
                    ephemeral: true
                });
            }

            // Show confirmation with button
            const confirmButton = new ButtonBuilder()
                .setCustomId('analytics_clear_confirm')
                .setLabel('Ya, Hapus Semua')
                .setStyle(ButtonStyle.Danger);

            const cancelButton = new ButtonBuilder()
                .setCustomId('analytics_clear_cancel')
                .setLabel('Batal')
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('⚠️ Konfirmasi Hapus Data')
                .setDescription(`Anda akan menghapus **SEMUA** data analytics server ini.`)
                .addFields(
                    { name: '💬 Messages', value: `${counts.messages.toLocaleString()}`, inline: true },
                    { name: '🎙️ Voice Sessions', value: `${counts.voiceSessions.toLocaleString()}`, inline: true }
                )
                .setFooter({ text: 'Aksi ini tidak dapat dibatalkan!' });

            const response = await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

            try {
                const confirmation = await response.awaitMessageComponent({ time: 30000 });

                if (confirmation.customId === 'analytics_clear_confirm') {
                    const result = clearAnalyticsData(interaction.guildId);

                    await confirmation.update({
                        embeds: [new EmbedBuilder()
                            .setColor('#00ff00')
                            .setTitle('✅ Data Dihapus!')
                            .setDescription(`Berhasil menghapus ${result.messagesDeleted.toLocaleString()} messages dan ${result.voiceSessionsDeleted.toLocaleString()} voice sessions.`)
                        ],
                        components: []
                    });
                } else {
                    await confirmation.update({
                        embeds: [new EmbedBuilder().setColor('#00a8ff').setDescription('❌ Dibatalkan.')],
                        components: []
                    });
                }
            } catch (error) {
                await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor('#ffaa00').setDescription('⏰ Waktu habis, tidak ada perubahan.')],
                    components: []
                });
            }
        }

        // ============ TEST PREVIEW ============
        else if (subcommandGroup === 'test' && subcommand === 'preview') {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.reply({
                    embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ Hanya Administrator yang bisa menggunakan test commands!')],
                    ephemeral: true
                });
            }

            await interaction.deferReply({ ephemeral: true });

            try {
                const embed = await generateWeeklyReport(interaction.client, interaction.guildId);
                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.error('Analytics test preview error:', error);
                await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor('Red').setDescription(`❌ Gagal preview report: ${error.message}`)]
                });
            }
        }
    }
};
