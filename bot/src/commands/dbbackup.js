const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { isBotOwner, getDatabaseStats, backupAllDatabases, getBotOwnerId } = require('../utils/settingsDB');
const path = require('path');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dbbackup')
        .setDescription('🔐 Database management (Owner only)')
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('Lihat statistik database')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('download')
                .setDescription('Download backup semua database sebagai ZIP')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Lihat daftar file backup yang tersedia')
        ),

    async execute(interaction) {
        // Owner-only check
        if (!isBotOwner(interaction.user.id)) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('🔒 **Access Denied**\n\nCommand ini hanya bisa diakses oleh Bot Owner.')
                ],
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'stats') {
            await interaction.deferReply({ ephemeral: true });

            try {
                const stats = getDatabaseStats();

                const embed = new EmbedBuilder()
                    .setColor('#a200ff')
                    .setTitle('📊 Database Statistics')
                    .addFields(
                        { name: '🌐 Guilds', value: String(stats.guilds), inline: true },
                        { name: '👮 Admins', value: String(stats.admins), inline: true },
                        { name: '⚙️ Settings', value: String(stats.settings), inline: true },
                        { name: '💾 Total Size', value: formatBytes(stats.totalSize), inline: true }
                    )
                    .setTimestamp();

                // Add file details
                if (stats.files.length > 0) {
                    const fileList = stats.files.map(f =>
                        `\`${f.name}\` - ${formatBytes(f.size)}`
                    ).join('\n');
                    embed.addFields({ name: '📁 Database Files', value: fileList });
                }

                await interaction.editReply({ embeds: [embed] });

            } catch (error) {
                console.error('[DBBackup] Stats error:', error);
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setDescription(`❌ Error: ${error.message}`)
                    ]
                });
            }
        }

        else if (subcommand === 'download') {
            await interaction.deferReply({ ephemeral: true });

            try {
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#ffaa00')
                            .setDescription('📦 Creating backup...')
                    ]
                });

                const backupPath = await backupAllDatabases();
                const fileName = path.basename(backupPath);
                const fileStats = fs.statSync(backupPath);

                // Check file size (Discord limit is 25MB for bots, 8MB for users)
                const maxSize = 25 * 1024 * 1024; // 25MB
                if (fileStats.size > maxSize) {
                    return interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('Red')
                                .setDescription(`❌ Backup file too large (${formatBytes(fileStats.size)}). Maximum is 25MB.\n\nBackup saved at: \`${backupPath}\``)
                        ]
                    });
                }

                const attachment = new AttachmentBuilder(backupPath, { name: fileName });

                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('✅ Database Backup Complete')
                    .addFields(
                        { name: '📁 File', value: `\`${fileName}\``, inline: true },
                        { name: '💾 Size', value: formatBytes(fileStats.size), inline: true },
                        { name: '📅 Created', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                    )
                    .setFooter({ text: 'Backup includes all .db and .json files from data directory' });

                await interaction.editReply({
                    embeds: [embed],
                    files: [attachment]
                });

            } catch (error) {
                console.error('[DBBackup] Download error:', error);
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setDescription(`❌ Backup failed: ${error.message}`)
                    ]
                });
            }
        }

        else if (subcommand === 'list') {
            await interaction.deferReply({ ephemeral: true });

            try {
                const dataDir = process.env.DATABASE_PATH || path.join(__dirname, '../../data');
                const backupDir = path.join(dataDir, 'backups');

                if (!fs.existsSync(backupDir)) {
                    return interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('#ffaa00')
                                .setDescription('📁 No backups found. Use `/dbbackup download` to create one.')
                        ]
                    });
                }

                const files = fs.readdirSync(backupDir)
                    .filter(f => f.endsWith('.zip'))
                    .map(f => {
                        const stats = fs.statSync(path.join(backupDir, f));
                        return {
                            name: f,
                            size: stats.size,
                            created: stats.birthtime
                        };
                    })
                    .sort((a, b) => b.created - a.created)
                    .slice(0, 10); // Show last 10

                if (files.length === 0) {
                    return interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('#ffaa00')
                                .setDescription('📁 No backups found. Use `/dbbackup download` to create one.')
                        ]
                    });
                }

                const fileList = files.map((f, i) =>
                    `${i + 1}. \`${f.name}\` - ${formatBytes(f.size)}`
                ).join('\n');

                const embed = new EmbedBuilder()
                    .setColor('#a200ff')
                    .setTitle('📦 Available Backups')
                    .setDescription(fileList)
                    .setFooter({ text: `Showing ${files.length} most recent backups` });

                await interaction.editReply({ embeds: [embed] });

            } catch (error) {
                console.error('[DBBackup] List error:', error);
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setDescription(`❌ Error: ${error.message}`)
                    ]
                });
            }
        }
    }
};

// Helper function to format bytes
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
