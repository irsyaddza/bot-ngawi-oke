const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
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
            // Check if there's an existing non-DisTube voice connection and disconnect it
            const existingConnection = getVoiceConnection(interaction.guildId);
            if (existingConnection) {
                // Store the channel info for later rejoin after music ends
                interaction.client.musicVoiceChannel = interaction.client.musicVoiceChannel || new Map();
                interaction.client.musicVoiceChannel.set(interaction.guildId, voiceChannel.id);

                existingConnection.destroy();
            }

            await interaction.client.distube.play(voiceChannel, query, {
                member: interaction.member,
                textChannel: interaction.channel,
                interaction
            });

            // Create control buttons
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
                        .setCustomId('music_voldown')
                        .setEmoji('🔉')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('music_volup')
                        .setEmoji('🔊')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('music_autoplay')
                        .setEmoji('📻')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('music_queue')
                        .setEmoji('📜')
                        .setStyle(ButtonStyle.Secondary)
                );

            const filterMenu = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('music_filter')
                        .setPlaceholder('🎛️ Select Audio Filter')
                        .addOptions([
                            { label: '❌ Clear Filters', value: 'clear', description: 'Remove all filters' },
                            { label: '🔊 Bassboost', value: 'bassboost', description: 'Boost the bass' },
                            { label: '🌙 Nightcore', value: 'nightcore', description: 'Speed up + higher pitch' },
                            { label: '🌊 Vaporwave', value: 'vaporwave', description: 'Slow down + lower pitch' },
                            { label: '🎭 8D Audio', value: '8d', description: 'Rotating audio effect' },
                            { label: '🎤 Karaoke', value: 'karaoke', description: 'Remove vocals' },
                            { label: '📢 Earrape', value: 'earrape', description: 'Maximum bass (warning!)' },
                            { label: '🎵 Treble', value: 'treble', description: 'Boost high frequencies' },
                            { label: '🔔 Flanger', value: 'flanger', description: 'Flanger effect' },
                            { label: '🌀 Tremolo', value: 'tremolo', description: 'Tremolo effect' }
                        ])
                );

            const embed = new EmbedBuilder()
                .setColor('#a200ff')
                .setTitle('🎮 Music Controls')
                .setDescription(`🔍 Searching: **${query}**\n\nUse the buttons below to control playback.`)
                .addFields(
                    { name: 'Controls', value: '⏮️ Previous | ⏯️ Pause/Resume | ⏭️ Skip | ⏹️ Stop | 🔀 Shuffle', inline: false },
                    { name: 'Options', value: '🔁 Repeat | 🔉🔊 Volume | 📻 Autoplay | 📜 Queue', inline: false }
                );

            await interaction.editReply({
                embeds: [embed],
                components: [row1, row2, filterMenu]
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
