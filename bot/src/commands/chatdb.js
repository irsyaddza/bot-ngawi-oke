const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../data/chat_history.db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('chatdb')
        .setDescription('📊 Lihat statistik database chat history')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        // Check if database exists
        if (!fs.existsSync(DB_PATH)) {
            return interaction.reply({
                content: '❌ Database belum ada. Chat dulu sama bot!',
                ephemeral: true
            });
        }

        try {
            const db = new Database(DB_PATH, { readonly: true });

            // Get stats
            const totalGuilds = db.prepare('SELECT COUNT(*) as count FROM chat_history').get().count;

            // Get all rows
            const allRows = db.prepare('SELECT messages, history_key, updated_at FROM chat_history ORDER BY updated_at DESC').all();

            let totalMessages = 0;
            const guildStats = [];

            allRows.forEach(row => {
                try {
                    const messages = JSON.parse(row.messages);
                    const msgCount = messages.length - 2; // Exclude system prompt
                    totalMessages += msgCount;

                    guildStats.push({
                        guildId: row.history_key, // Now it's just guildId
                        count: msgCount,
                        lastActive: row.updated_at
                    });
                } catch (e) { }
            });

            // Sort by message count
            guildStats.sort((a, b) => b.count - a.count);

            // Get database file size
            const stats = fs.statSync(DB_PATH);
            const dbSize = (stats.size / 1024).toFixed(2); // KB

            // Check this guild's stats
            const thisGuild = guildStats.find(g => g.guildId === interaction.guildId);

            // Build embed
            const embed = new EmbedBuilder()
                .setColor('#00AAFF')
                .setTitle('📊 Chat History Database')
                .setDescription('Statistik memori percakapan AI (per-server)')
                .addFields(
                    { name: '🏠 Total Servers', value: `${totalGuilds}`, inline: true },
                    { name: '📝 Total Messages', value: `${totalMessages}`, inline: true },
                    { name: '💾 Database Size', value: `${dbSize} KB`, inline: true }
                )
                .setTimestamp();

            // This guild's stats
            if (thisGuild) {
                const lastActive = Math.floor(thisGuild.lastActive / 1000);
                embed.addFields(
                    { name: '📊 Server Ini', value: `${thisGuild.count} messages`, inline: true },
                    { name: '🕐 Last Activity', value: `<t:${lastActive}:R>`, inline: true }
                );
            } else {
                embed.addFields({ name: '📊 Server Ini', value: 'Belum ada data', inline: true });
            }

            embed.setFooter({ text: `Database: chat_history.db | Use /clearchat to reset` });

            db.close();

            await interaction.reply({ embeds: [embed], ephemeral: false });

        } catch (error) {
            console.error('ChatDB Error:', error);
            await interaction.reply({
                content: `❌ Error: ${error.message}`,
                ephemeral: true
            });
        }
    }
};
