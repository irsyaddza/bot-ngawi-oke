const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getSounds, deleteSound, getSoundsDir } = require('../utils/soundMetadata');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('soundboarddelete')
        .setDescription('🗑️ Hapus sound dari soundboard')
        .addStringOption(option =>
            option
                .setName('soundname')
                .setDescription('Nama sound yang ingin dihapus')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async autocomplete(interaction) {
        try {
            const focusedValue = interaction.options.getFocused();
            const sounds = getSounds(interaction.guild.id);
            
            // Filter sounds based on input
            const filtered = sounds
                .filter(s => s.name.toLowerCase().includes(focusedValue.toLowerCase()))
                .slice(0, 25);

            await interaction.respond(
                filtered.map(s => ({
                    name: s.name,
                    value: s.id
                }))
            );
        } catch (error) {
            console.error('[SoundboardDelete] Autocomplete error:', error);
        }
    },

    async execute(interaction) {
        try {
            const soundId = interaction.options.getString('soundname');
            const sounds = getSounds(interaction.guild.id);
            const sound = sounds.find(s => s.id === soundId);

            if (!sound) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setDescription('❌ Sound tidak ditemukan')
                    ],
                    ephemeral: true
                });
            }

            // Confirm deletion
            const confirmEmbed = new EmbedBuilder()
                .setColor('Yellow')
                .setTitle('🗑️ Konfirmasi Hapus Sound')
                .setDescription(`Yakin ingin menghapus sound ini?`)
                .addFields([
                    {
                        name: '🎵 Nama Sound',
                        value: sound.name,
                        inline: false
                    },
                    {
                        name: '📝 Deskripsi',
                        value: sound.description || '(Tidak ada)',
                        inline: false
                    },
                    {
                        name: '📊 Play Count',
                        value: `${sound.playCount || 0} kali`,
                        inline: true
                    },
                    {
                        name: '⏱️ Diupload',
                        value: new Date(sound.uploadedAt).toLocaleDateString('id-ID'),
                        inline: true
                    }
                ])
                .setFooter({ text: 'Reaksi untuk konfirmasi' });

            const message = await interaction.reply({
                embeds: [confirmEmbed],
                ephemeral: true,
                fetchReply: true
            });

            // Add reactions for confirmation
            await message.react('✅');
            await message.react('❌');

            // Wait for reaction
            const filter = (reaction, user) => 
                (reaction.emoji.name === '✅' || reaction.emoji.name === '❌') && 
                user.id === interaction.user.id;

            const collector = message.createReactionCollector({ 
                filter, 
                time: 30000,
                max: 1
            });

            collector.on('collect', async (reaction) => {
                try {
                    if (reaction.emoji.name === '✅') {
                        // Delete the sound
                        const assetPath = getSoundsDir();
                        const success = deleteSound(interaction.guild.id, soundId, assetPath);

                        if (success) {
                            console.log(`[SoundboardDelete] Deleted sound: ${sound.name} (${sound.filename})`);
                            
                            await interaction.editReply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor('Green')
                                        .setTitle('✅ Sound Berhasil Dihapus')
                                        .setDescription(`Sound **${sound.name}** telah dihapus dari soundboard`)
                                        .addFields([
                                            {
                                                name: '🗑️ Dihapus',
                                                value: `${sound.filename}`,
                                                inline: false
                                            }
                                        ])
                                ],
                                components: []
                            });
                        } else {
                            await interaction.editReply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor('Red')
                                        .setDescription('❌ Gagal menghapus sound')
                                ],
                                components: []
                            });
                        }
                    } else {
                        // Cancelled
                        await interaction.editReply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor('Gray')
                                    .setDescription('⏹️ Pembatalan. Sound tidak dihapus.')
                            ],
                            components: []
                        });
                    }
                } catch (error) {
                    console.error('[SoundboardDelete] Reaction handler error:', error);
                    await interaction.editReply({
                        content: `❌ Error: ${error.message}`,
                        components: []
                    }).catch(() => {});
                }
            });

            collector.on('end', (collected) => {
                if (collected.size === 0) {
                    interaction.editReply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor('Gray')
                                .setDescription('⏱️ Waktu habis. Pembatalan.')
                        ],
                        components: []
                    }).catch(() => {});
                }
            });

        } catch (error) {
            console.error('[SoundboardDelete] Error:', error);
            return interaction.reply({
                content: `❌ Error: ${error.message}`,
                ephemeral: true
            });
        }
    }
};
