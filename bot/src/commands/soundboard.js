const { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { getVoiceConnection, joinVoiceChannel, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const { playMP3 } = require('../utils/audioUtils');
const { getSounds } = require('../utils/soundMetadata');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('soundboard')
        .setDescription('🎧 Pilih dan mainkan custom sounds')
        .addSubcommand(subcommand =>
            subcommand
                .setName('play')
                .setDescription('Mainkan sound dari soundboard')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Lihat daftar semua sounds yang tersedia')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'list') {
            return await handleList(interaction);
        }

        if (subcommand === 'play') {
            return await handlePlay(interaction);
        }
    }
};

async function handleList(interaction) {
    try {
        const sounds = getSounds(interaction.guild.id);

        if (sounds.length === 0) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Blue')
                        .setTitle('🎧 Soundboard')
                        .setDescription('Belum ada sounds yang diupload.\n\nGunakan `/uploadsound` untuk menambah sounds ke soundboard!')
                ],
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor('Purple')
            .setTitle('🎧 Soundboard - Available Sounds')
            .setDescription(`Total: ${sounds.length} sounds`)
            .addFields(
                sounds.slice(0, 25).map(sound => ({
                    name: `🔊 ${sound.name}`,
                    value: `Plays: ${sound.playCount || 0} | ${sound.description || 'No description'}`,
                    inline: false
                }))
            );

        if (sounds.length > 25) {
            embed.setFooter({ text: `Showing 25 of ${sounds.length}` });
        }

        return interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('[Soundboard:List] Error:', error);
        return interaction.reply({
            content: '❌ Gagal mengambil daftar sounds',
            ephemeral: true
        });
    }
}

async function handlePlay(interaction) {
    try {
        // Check if user is in a voice channel
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('❌ Kamu harus berada di voice channel untuk mainkan sound!')
                ],
                ephemeral: true
            });
        }

        // Get all sounds for this guild
        const sounds = getSounds(interaction.guild.id);

        if (sounds.length === 0) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Yellow')
                        .setDescription('⚠️ Belum ada sounds di soundboard.\n\nGunakan `/uploadsound` untuk menambah sounds.')
                ],
                ephemeral: true
            });
        }

        // Limit to 25 options (Discord limit)
        const displaySounds = sounds.slice(0, 25);

        // Create select menu
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('soundboard_select')
            .setPlaceholder('Pilih sound untuk dimainkan...')
            .addOptions(
                displaySounds.map(sound => ({
                    label: sound.name,
                    value: sound.id,
                    description: `${sound.playCount || 0} plays - ${sound.description || 'No desc'}`.substring(0, 100),
                    emoji: '🎵'
                }))
            );

        const row = new ActionRowBuilder()
            .addComponents(selectMenu);

        // Send initial reply with select menu
        await interaction.reply({
            content: '🎧 Pilih sound yang ingin dimainkan:',
            components: [row],
            ephemeral: true
        });

        // Wait for selection
        const collector = interaction.channel.createMessageComponentCollector({
            filter: i => i.customId === 'soundboard_select' && i.user.id === interaction.user.id,
            time: 60000,
            max: 1
        });

        collector.on('collect', async (selectInteraction) => {
            const soundId = selectInteraction.values[0];
            const selectedSound = sounds.find(s => s.id === soundId);

            if (!selectedSound) {
                return selectInteraction.reply({
                    content: '❌ Sound tidak ditemukan',
                    ephemeral: true
                });
            }

            try {
                await selectInteraction.deferReply();

                // Get or create voice connection
                let connection = getVoiceConnection(interaction.guild.id);

                if (!connection) {
                    // Join voice channel
                    connection = joinVoiceChannel({
                        channelId: voiceChannel.id,
                        guildId: interaction.guild.id,
                        adapterCreator: interaction.guild.voiceAdapterCreator
                    });

                    // Wait for connection to be ready
                    try {
                        await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
                    } catch (error) {
                        console.error('[Soundboard] Failed to join voice channel:', error);
                        connection.destroy();
                        return selectInteraction.editReply({
                            content: '❌ Gagal terhubung ke voice channel!'
                        });
                    }
                }

                // Play the sound
                const botPermissions = voiceChannel.permissionsFor(interaction.client.user);
                if (!botPermissions?.has('Speak')) {
                    return selectInteraction.editReply({
                        content: '❌ Bot tidak punya permission untuk speak di voice channel ini!'
                    });
                }

                console.log(`[Soundboard] Playing: ${selectedSound.name} (${selectedSound.filename})`);

                await selectInteraction.editReply({
                    content: `🎵 Memutar: **${selectedSound.name}**...`
                });

                // Play MP3
                await playMP3(connection, selectedSound.filename);

                // Record playback
                const metadata = require('../utils/soundMetadata');
                metadata.recordPlayback(interaction.guild.id, soundId);

                await selectInteraction.editReply({
                    content: `✅ Selesai memutar: **${selectedSound.name}**`
                });

            } catch (error) {
                console.error('[Soundboard:Play] Error:', error);
                return selectInteraction.editReply({
                    content: `❌ Gagal memutar sound: ${error.message}`
                });
            }
        });

        collector.on('end', (collected) => {
            if (collected.size === 0) {
                interaction.editReply({
                    content: '⏱️ Waktu habis, pilihan dibatalkan.',
                    components: []
                }).catch(() => {});
            }
        });

    } catch (error) {
        console.error('[Soundboard:Play] Error:', error);
        return interaction.reply({
            content: `❌ Error: ${error.message}`,
            ephemeral: true
        });
    }
}
