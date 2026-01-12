const { Events, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

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
            const player = interaction.client.kazagumo?.players.get(interaction.guildId);
            const voiceChannel = interaction.member.voice.channel;

            if (!voiceChannel) {
                return interaction.reply({
                    embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ You must be in a voice channel!')],
                    ephemeral: true
                });
            }

            if (!player || !player.queue.current) {
                return interaction.reply({
                    embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ There is nothing playing!')],
                    ephemeral: true
                });
            }

            try {
                const action = interaction.customId.replace('music_', '');

                switch (action) {
                    case 'previous':
                        if (!player.queue.previous) {
                            return interaction.reply({
                                embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ No previous song!')],
                                ephemeral: true
                            });
                        }
                        // Kazagumo doesn't have built-in previous, skip back by replaying current track
                        player.seek(0);
                        await interaction.reply({
                            embeds: [new EmbedBuilder().setColor('#a200ff').setDescription('⏮️ Restarted current song!')],
                            ephemeral: true
                        });
                        break;

                    case 'pause':
                        if (player.paused) {
                            player.pause(false);
                            await interaction.reply({
                                embeds: [new EmbedBuilder().setColor('#00ff88').setDescription('▶️ Resumed!')],
                                ephemeral: true
                            });
                        } else {
                            player.pause(true);
                            await interaction.reply({
                                embeds: [new EmbedBuilder().setColor('#ffaa00').setDescription('⏸️ Paused!')],
                                ephemeral: true
                            });
                        }
                        break;

                    case 'skip':
                        if (player.queue.length === 0) {
                            player.destroy();
                            await interaction.reply({
                                embeds: [new EmbedBuilder().setColor('#a200ff').setDescription('⏭️ Skipped! Queue is now empty.')],
                                ephemeral: true
                            });
                        } else {
                            player.skip();
                            await interaction.reply({
                                embeds: [new EmbedBuilder().setColor('#a200ff').setDescription('⏭️ Skipped to next song!')],
                                ephemeral: true
                            });
                        }
                        break;

                    case 'stop':
                        player.destroy();
                        await interaction.reply({
                            embeds: [new EmbedBuilder().setColor('Red').setDescription('⏹️ Stopped and cleared the queue!')],
                            ephemeral: true
                        });
                        break;

                    case 'shuffle':
                        player.queue.shuffle();
                        await interaction.reply({
                            embeds: [new EmbedBuilder().setColor('#a200ff').setDescription('🔀 Queue shuffled!')],
                            ephemeral: true
                        });
                        break;

                    case 'repeat':
                        const modes = ['Off', 'Track', 'Queue'];
                        const newMode = player.loop === 'none' ? 'track' : player.loop === 'track' ? 'queue' : 'none';
                        player.setLoop(newMode);
                        const modeText = newMode === 'none' ? 'Off' : newMode === 'track' ? 'Track' : 'Queue';
                        await interaction.reply({
                            embeds: [new EmbedBuilder().setColor('#a200ff').setDescription(`🔁 Repeat mode: **${modeText}**`)],
                            ephemeral: true
                        });
                        break;

                    case 'voldown':
                    case 'volup':
                        // Volume controls disabled - Kazagumo uses different volume format
                        await interaction.reply({
                            embeds: [new EmbedBuilder().setColor('#ffaa00').setDescription('⚠️ Volume controls are currently disabled.')],
                            ephemeral: true
                        });
                        break;

                    case 'queue':
                        const currentTrack = player.queue.current;
                        const tracks = Array.from(player.queue);
                        let queueList = '';

                        for (let i = 0; i < Math.min(tracks.length, 5); i++) {
                            const dur = formatDuration(tracks[i].length);
                            queueList += `**${i + 1}.** ${tracks[i].title} - \`${dur}\`\n`;
                        }
                        if (tracks.length > 5) queueList += `...and **${tracks.length - 5}** more`;

                        const queueEmbed = new EmbedBuilder()
                            .setColor('#a200ff')
                            .setTitle('📜 Queue')
                            .setDescription(`**Now Playing:**\n🎶 ${currentTrack.title}\n\n${queueList || 'No songs in queue'}`);

                        await interaction.reply({ embeds: [queueEmbed], ephemeral: true });
                        break;

                    case 'lyrics':
                        const lyricTrack = player.queue.current;
                        if (!lyricTrack) {
                            return interaction.reply({
                                embeds: [new EmbedBuilder().setColor('Red').setDescription('❌ No track currently playing!')],
                                ephemeral: true
                            });
                        }

                        await interaction.deferReply({ ephemeral: true });

                        try {
                            // Clean up the title - remove common suffixes like (Official Video), [HD], etc.
                            let cleanTitle = lyricTrack.title
                                .replace(/\(Official.*?\)/gi, '')
                                .replace(/\[Official.*?\]/gi, '')
                                .replace(/\(Lyric.*?\)/gi, '')
                                .replace(/\[Lyric.*?\]/gi, '')
                                .replace(/\(Audio.*?\)/gi, '')
                                .replace(/\[Audio.*?\]/gi, '')
                                .replace(/\(Music Video\)/gi, '')
                                .replace(/\[HD\]/gi, '')
                                .replace(/\[4K\]/gi, '')
                                .replace(/\(feat\..*?\)/gi, '')
                                .replace(/\[feat\..*?\]/gi, '')
                                .trim();

                            let lyrics = null;
                            let source = 'Unknown';

                            // Try Lrclib API first
                            try {
                                const searchQuery = encodeURIComponent(`${lyricTrack.author || ''} ${cleanTitle}`.trim());
                                const lrclibResponse = await fetch(`https://lrclib.net/api/search?q=${searchQuery}`, {
                                    headers: {
                                        'User-Agent': 'RusdiBot/1.0 (https://github.com/irsyaddza/bot-ngawi-oke)'
                                    }
                                });

                                if (lrclibResponse.ok) {
                                    const lrclibData = await lrclibResponse.json();
                                    if (lrclibData && lrclibData.length > 0) {
                                        // Get plain lyrics (not synced) from first result
                                        lyrics = lrclibData[0].plainLyrics || lrclibData[0].syncedLyrics?.replace(/\[\d+:\d+\.\d+\]/g, '').trim();
                                        source = 'LRCLIB';
                                    }
                                }
                            } catch (lrclibErr) {
                                console.log('[Lyrics] Lrclib failed, trying fallback:', lrclibErr.message);
                            }

                            // Fallback to lyrics-finder if Lrclib didn't work
                            if (!lyrics) {
                                try {
                                    const lyricsFinder = require('lyrics-finder');
                                    lyrics = await lyricsFinder(lyricTrack.author || '', cleanTitle);
                                    if (lyrics && lyrics !== 'Not Found!' && lyrics.trim() !== '') {
                                        source = 'Google';
                                    } else {
                                        lyrics = null;
                                    }
                                } catch (fallbackErr) {
                                    console.log('[Lyrics] Fallback also failed:', fallbackErr.message);
                                }
                            }

                            if (!lyrics || lyrics.trim() === '') {
                                return interaction.editReply({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setColor('#ffaa00')
                                            .setTitle(`🎤 Lyrics: ${lyricTrack.title}`)
                                            .setDescription('❌ Lyrics not found for this track.\n\nTry searching manually on [Genius](https://genius.com) or [AZLyrics](https://azlyrics.com)')
                                    ]
                                });
                            }

                            // Truncate if too long (Discord embed limit is 4096)
                            let displayLyrics = lyrics;
                            if (lyrics.length > 3800) {
                                displayLyrics = lyrics.substring(0, 3800) + '\n\n... *[Lyrics truncated]*';
                            }

                            const lyricsEmbed = new EmbedBuilder()
                                .setColor('#a200ff')
                                .setTitle(`🎤 Lyrics: ${lyricTrack.title}`)
                                .setDescription(displayLyrics)
                                .setFooter({ text: `Artist: ${lyricTrack.author || 'Unknown'} | Source: ${source}` });

                            await interaction.editReply({ embeds: [lyricsEmbed] });
                        } catch (lyricsError) {
                            console.error('Lyrics fetch error:', lyricsError);
                            await interaction.editReply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor('Red')
                                        .setDescription(`❌ Failed to fetch lyrics: ${lyricsError.message}`)
                                ]
                            });
                        }
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

        // Music filter select menu removed (DisTube-specific feature)

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

