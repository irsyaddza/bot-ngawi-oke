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
            const totalConversations = db.prepare('SELECT COUNT(*) as count FROM chat_history').get().count;

            // Get all rows to calculate total messages
            const allRows = db.prepare('SELECT messages, history_key, updated_at FROM chat_history ORDER BY updated_at DESC').all();

            let totalMessages = 0;
            const topChatters = [];

            allRows.forEach(row => {
                try {
                    const messages = JSON.parse(row.messages);
                    const msgCount = messages.length - 2; // Exclude system prompt
                    totalMessages += msgCount;

                    // Extract user ID from history_key (userId-channelId)
                    const userId = row.history_key.split('-')[0];
                    topChatters.push({
                        key: row.history_key,
                        userId,
                        count: msgCount,
                        lastActive: row.updated_at
                    });
                } catch (e) { }
            });

            // Sort by message count
            topChatters.sort((a, b) => b.count - a.count);

            // Get database file size
            const stats = fs.statSync(DB_PATH);
            const dbSize = (stats.size / 1024).toFixed(2); // KB

            // Build embed
            const embed = new EmbedBuilder()
                .setColor('#00AAFF')
                .setTitle('📊 Chat History Database')
                .setDescription('Statistik memori percakapan AI')
                .addFields(
                    { name: '💬 Total Conversations', value: `${totalConversations}`, inline: true },
                    { name: '📝 Total Messages', value: `${totalMessages}`, inline: true },
                    { name: '💾 Database Size', value: `${dbSize} KB`, inline: true }
                )
                .setTimestamp();

            // Add top chatters (max 5)
            if (topChatters.length > 0) {
                const topList = topChatters.slice(0, 5).map((c, i) => {
                    const medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i];
                    return `${medal} <@${c.userId}> - ${c.count} msgs`;
                }).join('\n');

                embed.addFields({ name: '🔥 Top Chatters', value: topList, inline: false });
            }

            // Add recent activity (last 5)
            if (allRows.length > 0) {
                const recentList = allRows.slice(0, 5).map(row => {
                    const userId = row.history_key.split('-')[0];
                    const time = Math.floor(row.updated_at / 1000);
                    return `<@${userId}> - <t:${time}:R>`;
                }).join('\n');

                embed.addFields({ name: '🕐 Recent Activity', value: recentList, inline: false });
            }

            embed.setFooter({ text: `Database: chat_history.db` });

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
