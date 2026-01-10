const { Events, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    execute: async (interaction) => {
        // Handle Slash Commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Error executing ${interaction.commandName}`);
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
            return;
        }

        // Handle Context Menu Commands
        if (interaction.isMessageContextMenuCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No context menu command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Error executing context menu ${interaction.commandName}`);
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
            return;
        }

        // Handle /cmd Category Select Menu
        if (interaction.isStringSelectMenu() && interaction.customId === 'cmd_category') {
            const { handleCmdSelect } = require('../commands/cmd.js');
            await handleCmdSelect(interaction);
            return;
        }

        // Handle Download Caption Button
        if (interaction.isButton() && interaction.customId.startsWith('dl_caption_')) {
            try {
                const captionId = interaction.customId.replace('dl_caption_', '');

                // Get caption from cache
                const downloadCommand = require('../commands/download.js');
                const captionData = downloadCommand.captionCache?.get(captionId);

                if (!captionData || Date.now() > captionData.expires) {
                    return interaction.reply({
                        content: 'Caption sudah expired. Download ulang videonya.',
                        ephemeral: true
                    });
                }

                const caption = captionData.text;

                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('#a200ff')
                            .setTitle('Caption')
                            .setDescription(caption.length > 4000 ? caption.substring(0, 4000) + '...' : caption)
                    ],
                    ephemeral: true
                });
            } catch (error) {
                console.error('Caption error:', error);
                await interaction.reply({
                    content: 'Failed to load caption.',
                    ephemeral: true
                });
            }
            return;
        }

        // Handle Music Button Interactions
        if (interaction.isButton() && interaction.customId.startsWith('music_')) {
            const queue = interaction.client.distube.getQueue(interaction.guildId);
            const voiceChannel = interaction.member.voice.channel;

            if (!voiceChannel) {
                return interaction.reply({
                    embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ You must be in a voice channel!')],
                    ephemeral: true
                });
            }

            if (!queue) {
                return interaction.reply({
                    embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ There is nothing playing!')],
                    ephemeral: true
                });
            }

            try {
                const action = interaction.customId.replace('music_', '');

                switch (action) {
                    case 'previous':
                        if (queue.previousSongs.length === 0) {
                            return interaction.reply({
                                embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ No previous song!')],
                                ephemeral: true
                            });
                        }
                        await queue.previous();
                        await interaction.reply({
                            embeds: [new EmbedBuilder().setColor('#a200ff').setDescription('⏮️ Playing previous song!')],
                            ephemeral: true
                        });
                        break;

                    case 'pause':
                        if (queue.paused) {
                            await queue.resume();
                            await interaction.reply({
                                embeds: [new EmbedBuilder().setColor('#00ff88').setDescription('▶️ Resumed!')],
                                ephemeral: true
                            });
                        } else {
                            await queue.pause();
                            await interaction.reply({
                                embeds: [new EmbedBuilder().setColor('#ffaa00').setDescription('⏸️ Paused!')],
                                ephemeral: true
                            });
                        }
                        break;

                    case 'skip':
                        if (queue.songs.length <= 1) {
                            await queue.stop();
                            await interaction.reply({
                                embeds: [new EmbedBuilder().setColor('#a200ff').setDescription('⏭️ Skipped! Queue is now empty.')],
                                ephemeral: true
                            });
                        } else {
                            await queue.skip();
                            await interaction.reply({
                                embeds: [new EmbedBuilder().setColor('#a200ff').setDescription('⏭️ Skipped to next song!')],
                                ephemeral: true
                            });
                        }
                        break;

                    case 'stop':
                        await queue.stop();
                        await interaction.reply({
                            embeds: [new EmbedBuilder().setColor('Red').setDescription('⏹️ Stopped and cleared the queue!')],
                            ephemeral: true
                        });
                        break;

                    case 'shuffle':
                        await queue.shuffle();
                        await interaction.reply({
                            embeds: [new EmbedBuilder().setColor('#a200ff').setDescription('🔀 Queue shuffled!')],
                            ephemeral: true
                        });
                        break;

                    case 'repeat':
                        const modes = ['Off', 'Track', 'Queue'];
                        const newMode = queue.repeatMode === 2 ? 0 : queue.repeatMode + 1;
                        await queue.setRepeatMode(newMode);
                        await interaction.reply({
                            embeds: [new EmbedBuilder().setColor('#a200ff').setDescription(`🔁 Repeat mode: **${modes[newMode]}**`)],
                            ephemeral: true
                        });
                        break;

                    case 'voldown':
                        const newVolDown = Math.max(0, queue.volume - 10);
                        await queue.setVolume(newVolDown);
                        await interaction.reply({
                            embeds: [new EmbedBuilder().setColor('#a200ff').setDescription(`🔉 Volume: **${newVolDown}%**`)],
                            ephemeral: true
                        });
                        break;

                    case 'volup':
                        const newVolUp = Math.min(150, queue.volume + 10);
                        await queue.setVolume(newVolUp);
                        await interaction.reply({
                            embeds: [new EmbedBuilder().setColor('#a200ff').setDescription(`🔊 Volume: **${newVolUp}%**`)],
                            ephemeral: true
                        });
                        break;

                    case 'autoplay':
                        const autoplayState = queue.toggleAutoplay();
                        await interaction.reply({
                            embeds: [new EmbedBuilder().setColor('#a200ff').setDescription(`📻 Autoplay: **${autoplayState ? 'On' : 'Off'}**`)],
                            ephemeral: true
                        });
                        break;

                    case 'queue':
                        const songs = queue.songs;
                        const currentSong = songs[0];
                        let queueList = '';
                        for (let i = 1; i < Math.min(songs.length, 6); i++) {
                            queueList += `**${i}.** ${songs[i].name} - \`${songs[i].formattedDuration}\`\n`;
                        }
                        if (songs.length > 6) queueList += `...and **${songs.length - 6}** more`;

                        const queueEmbed = new EmbedBuilder()
                            .setColor('#a200ff')
                            .setTitle('📜 Queue')
                            .setDescription(`**Now Playing:**\n🎶 ${currentSong.name}\n\n${queueList || 'No songs in queue'}`);

                        await interaction.reply({ embeds: [queueEmbed], ephemeral: true });
                        break;
                }
            } catch (error) {
                console.error('Music button error:', error);
                await interaction.reply({
                    embeds: [new EmbedBuilder().setColor('Red').setDescription(`❌ Error: ${error.message}`)],
                    ephemeral: true
                });
            }
            return;
        }

        // Handle Music Filter Select Menu (Volume presets for DisTube v5 compatibility)
        if (interaction.isStringSelectMenu() && interaction.customId === 'music_filter') {
            const queue = interaction.client.distube.getQueue(interaction.guildId);
            const voiceChannel = interaction.member.voice.channel;

            if (!voiceChannel) {
                return interaction.reply({
                    embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ You must be in a voice channel!')],
                    ephemeral: true
                });
            }

            if (!queue) {
                return interaction.reply({
                    embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ There is nothing playing!')],
                    ephemeral: true
                });
            }

            try {
                const preset = interaction.values[0];

                // Volume presets instead of filters (DisTube v5 filter API changed)
                const presets = {
                    'clear': { vol: 100, name: 'Normal' },
                    'bassboost': { vol: 120, name: 'Bass Boost (120%)' },
                    'nightcore': { vol: 100, name: 'Nightcore (Note: speed filters require FFmpeg)' },
                    'vaporwave': { vol: 80, name: 'Vaporwave (80%)' },
                    '8d': { vol: 100, name: '8D Audio (Note: requires FFmpeg filter)' },
                    'karaoke': { vol: 100, name: 'Karaoke (Note: requires FFmpeg filter)' },
                    'earrape': { vol: 150, name: 'Earrape (150%)' },
                    'treble': { vol: 110, name: 'Treble Boost (110%)' },
                    'flanger': { vol: 100, name: 'Flanger (Note: requires FFmpeg filter)' },
                    'tremolo': { vol: 100, name: 'Tremolo (Note: requires FFmpeg filter)' }
                };

                const selected = presets[preset] || presets['clear'];
                await queue.setVolume(selected.vol);

                await interaction.reply({
                    embeds: [new EmbedBuilder().setColor('#a200ff').setDescription(`🎛️ Applied: **${selected.name}**\nVolume set to **${selected.vol}%**`)],
                    ephemeral: true
                });
            } catch (error) {
                console.error('Preset error:', error);
                await interaction.reply({
                    embeds: [new EmbedBuilder().setColor('Red').setDescription(`❌ Error: ${error.message}`)],
                    ephemeral: true
                });
            }
            return;
        }

        // Handle Modal Submissions
        if (interaction.isModalSubmit()) {
            // Handle Reply Modal
            if (interaction.customId.startsWith('reply_modal_')) {
                try {
                    // Parse channelId and messageId from customId
                    const parts = interaction.customId.split('_');
                    const channelId = parts[2];
                    const messageId = parts[3];

                    const replyContent = interaction.fields.getTextInputValue('reply_content');

                    // Get the channel and message
                    const channel = await interaction.client.channels.fetch(channelId);
                    const targetMessage = await channel.messages.fetch(messageId);

                    // Check bot permissions
                    const botPermissions = channel.permissionsFor(interaction.client.user);
                    if (!botPermissions.has(PermissionFlagsBits.SendMessages)) {
                        return interaction.reply({
                            content: `❌ Bot tidak memiliki izin untuk mengirim pesan di channel ini!`,
                            ephemeral: true
                        });
                    }

                    // Reply to the message
                    await targetMessage.reply({
                        content: replyContent,
                        allowedMentions: {
                            parse: ['users', 'roles'],
                            repliedUser: true
                        }
                    });

                    await interaction.reply({
                        content: `✅ Berhasil reply ke pesan dari **${targetMessage.author.username}**!`,
                        ephemeral: true
                    });

                } catch (error) {
                    console.error('Reply modal error:', error);
                    await interaction.reply({
                        content: '❌ Gagal mengirim reply. Pastikan pesan masih ada dan bot memiliki izin.',
                        ephemeral: true
                    });
                }
            }
            return;
        }
    },
};

