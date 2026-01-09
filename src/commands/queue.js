const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('📜 Show the current music queue'),

    async execute(interaction) {
        const queue = interaction.client.distube.getQueue(interaction.guildId);

        if (!queue) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('❌ There is nothing playing!')
                ],
                ephemeral: true
            });
        }

        const songs = queue.songs;
        const currentSong = songs[0];

        // Build queue list (max 10 songs shown)
        let queueList = '';
        for (let i = 1; i < Math.min(songs.length, 11); i++) {
            queueList += `**${i}.** [${songs[i].name}](${songs[i].url}) - \`${songs[i].formattedDuration}\`\n`;
        }

        if (songs.length > 11) {
            queueList += `\n...and **${songs.length - 11}** more songs`;
        }

        const embed = new EmbedBuilder()
            .setColor('#a200ff')
            .setTitle('📜 Music Queue')
            .setThumbnail(currentSong.thumbnail)
            .addFields(
                {
                    name: '🎶 Now Playing',
                    value: `**[${currentSong.name}](${currentSong.url})**\n⏱️ \`${currentSong.formattedDuration}\` | 👤 ${currentSong.user}`,
                    inline: false
                }
            )
            .setFooter({
                text: `🎵 ${songs.length} song(s) | 🔊 Volume: ${queue.volume}% | 🔁 Repeat: ${queue.repeatMode ? (queue.repeatMode === 2 ? 'Queue' : 'Track') : 'Off'}`
            });

        if (queueList) {
            embed.addFields({ name: '📋 Up Next', value: queueList, inline: false });
        }

        await interaction.reply({ embeds: [embed] });
    }
};
