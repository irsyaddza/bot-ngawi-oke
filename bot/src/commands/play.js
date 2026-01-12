const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('🎶 Play a song from YouTube, Spotify, or SoundCloud')
        .addStringOption(option =>
            option
                .setName('query')
                .setDescription('Song name or URL')
                .setRequired(true)
        ),

    async execute(interaction) {
        const query = interaction.options.getString('query');
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('❌ You must be in a voice channel to use this command!')
                ],
                ephemeral: true
            });
        }

        const botPermissions = voiceChannel.permissionsFor(interaction.client.user);
        if (!botPermissions.has('Connect') || !botPermissions.has('Speak')) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('❌ I need permissions to join and speak in your voice channel!')
                ],
                ephemeral: true
            });
        }

        await interaction.deferReply();

        try {
            const kazagumo = interaction.client.kazagumo;

            // Check if Kazagumo is initialized
            if (!kazagumo) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setDescription('❌ Music system not initialized. Please wait a moment and try again.')
                    ]
                });
            }

            // Check if any Lavalink node is available
            // Shoukaku stores nodes in a Map, we need at least one
            const availableNode = kazagumo.shoukaku.options.nodeResolver
                ? kazagumo.shoukaku.options.nodeResolver(kazagumo.shoukaku.nodes)
                : kazagumo.shoukaku.nodes.values().next().value;

            if (!availableNode) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setDescription('❌ No Lavalink nodes available. Please try again later.')
                    ]
                });
            }

            // Destroy existing non-Kazagumo voice connection
            const existingConnection = getVoiceConnection(interaction.guildId);
            if (existingConnection) {
                existingConnection.destroy();
            }

            // Create player using kazagumo.createPlayer (official method)
            let player = kazagumo.players.get(interaction.guildId);

            if (!player) {
                player = await kazagumo.createPlayer({
                    guildId: interaction.guildId,
                    textId: interaction.channel.id,
                    voiceId: voiceChannel.id,
                    volume: 100,
                    deaf: true
                });
            }

            // Search for track using kazagumo.search (official method)
            const result = await kazagumo.search(query, { requester: interaction.user });

            if (!result.tracks.length) {
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setDescription(`❌ No results found for: \`${query}\``)
                    ]
                });
            }

            // Handle playlist vs single track
            if (result.type === 'PLAYLIST') {
                player.queue.add(result.tracks);

                const embed = new EmbedBuilder()
                    .setColor('#00ff88')
                    .setDescription(`✅ Queued **${result.tracks.length}** tracks from **${result.playlistName}**`);

                await interaction.editReply({ embeds: [embed] });
            } else {
                player.queue.add(result.tracks[0]);

                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#00ff88')
                            .setDescription(`✅ Queued **[${result.tracks[0].title}](${result.tracks[0].uri})**`)
                    ]
                });
            }

            // Start playing if not already
            if (!player.playing && !player.paused) {
                player.play();
            }

            // Send control buttons in a separate message
            const row1 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('music_previous')
                        .setEmoji('⏮️')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('music_pause')
                        .setEmoji('⏯️')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('music_skip')
                        .setEmoji('⏭️')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('music_stop')
                        .setEmoji('⏹️')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('music_shuffle')
                        .setEmoji('🔀')
                        .setStyle(ButtonStyle.Secondary)
                );

            const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('music_repeat')
                        .setEmoji('🔁')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('music_queue')
                        .setEmoji('📜')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('music_lyrics')
                        .setEmoji('🎤')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#a200ff')
                        .setTitle('🎮 Music Controls')
                        .setDescription('Use the buttons below to control playback.')
                ],
                components: [row1, row2]
            });

        } catch (error) {
            console.error('Play command error:', error);
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription(`❌ Error: ${error.message}`)
                ]
            });
        }
    }
};
