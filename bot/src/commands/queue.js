const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// Helper function to format duration
function formatDuration(ms) {
    if (!ms) return '0:00';
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('📜 Show the current music queue'),

    async execute(interaction) {
        const player = interaction.client.kazagumo?.players.get(interaction.guildId);

        if (!player || !player.queue.current) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('❌ There is nothing playing!')
                ],
                ephemeral: true
            });
        }

        const currentTrack = player.queue.current;
        const queue = player.queue;

        // Build queue list (max 10 songs shown)
        let queueList = '';
        const tracks = Array.from(queue);
        for (let i = 0; i < Math.min(tracks.length, 10); i++) {
            queueList += `**${i + 1}.** [${tracks[i].title}](${tracks[i].uri}) - \`${formatDuration(tracks[i].length)}\`\n`;
        }

        if (tracks.length > 10) {
            queueList += `\n...and **${tracks.length - 10}** more songs`;
        }

        // Repeat mode text
        const repeatModes = ['Off', 'Track', 'Queue'];
        const repeatText = repeatModes[player.loop] || 'Off';

        const embed = new EmbedBuilder()
            .setColor('#a200ff')
            .setTitle('📜 Music Queue')
            .setThumbnail(currentTrack.thumbnail || null)
            .addFields(
                {
                    name: '🎶 Now Playing',
                    value: `**[${currentTrack.title}](${currentTrack.uri})**\n⏱️ \`${formatDuration(currentTrack.length)}\` | 👤 ${currentTrack.requester}`,
                    inline: false
                }
            )
            .setFooter({
                text: `🎵 ${tracks.length + 1} song(s) | 🔊 Volume: ${Math.round(player.volume * 100)}% | 🔁 Repeat: ${repeatText}`
            });

        if (queueList) {
            embed.addFields({ name: '📋 Up Next', value: queueList, inline: false });
        }

        await interaction.reply({ embeds: [embed] });
    }
};
