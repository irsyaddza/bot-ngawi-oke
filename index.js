require('dotenv').config();
const { Client, GatewayIntentBits, Collection, ActivityType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// DisTube imports
const { DisTube } = require('distube');
const { SpotifyPlugin } = require('@distube/spotify');
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { YtDlpPlugin } = require('@distube/yt-dlp');

// Set ffmpeg path for DisTube
const ffmpegPath = require('ffmpeg-static');
process.env.FFMPEG_PATH = ffmpegPath;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.commands = new Collection();

// DisTube Setup
client.distube = new DisTube(client, {
    ffmpeg: {
        path: ffmpegPath
    },
    plugins: [
        new SpotifyPlugin(),
        new SoundCloudPlugin(),
        new YtDlpPlugin({ update: false })
    ]
});

// Helper function to get queue status
const getStatus = queue =>
    `Volume: \`${queue.volume}%\` | Filter: \`${queue.filters.names.join(', ') || 'Off'}\` | Repeat: \`${queue.repeatMode ? (queue.repeatMode === 2 ? 'Queue' : 'Track') : 'Off'}\` | Autoplay: \`${queue.autoplay ? 'On' : 'Off'}\``;

// DisTube Event Handlers
client.distube
    .on('playSong', (queue, song) => {
        const embed = new EmbedBuilder()
            .setColor('#a200ff')
            .setTitle('🎶 Now Playing')
            .setDescription(`**[${song.name}](${song.url})**`)
            .addFields(
                { name: '⏱️ Duration', value: song.formattedDuration, inline: true },
                { name: '👤 Requested by', value: `${song.user}`, inline: true },
                { name: '🔊 Volume', value: `${queue.volume}%`, inline: true }
            )
            .setThumbnail(song.thumbnail)
            .setFooter({ text: getStatus(queue) });

        queue.textChannel.send({ embeds: [embed] });
    })
    .on('addSong', (queue, song) => {
        const embed = new EmbedBuilder()
            .setColor('#00ff88')
            .setDescription(`✅ Added **[${song.name}](${song.url})** - \`${song.formattedDuration}\` to the queue\nRequested by: ${song.user}`);

        queue.textChannel.send({ embeds: [embed] });
    })
    .on('addList', (queue, playlist) => {
        const embed = new EmbedBuilder()
            .setColor('#00ff88')
            .setDescription(`✅ Added **${playlist.name}** playlist\n\`${playlist.songs.length}\` songs added to queue\n${getStatus(queue)}`);

        queue.textChannel.send({ embeds: [embed] });
    })
    .on('error', (channel, e) => {
        if (channel) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(`⛔ Error: ${e.toString().slice(0, 1974)}`);
            channel.send({ embeds: [embed] });
        } else {
            console.error(e);
        }
    })
    .on('empty', channel => {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setDescription('⛔ Voice channel is empty! Leaving...');
        channel.send({ embeds: [embed] });
    })
    .on('searchNoResult', (message, query) => {
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setDescription(`⛔ No results found for: \`${query}\``);
        message.channel.send({ embeds: [embed] });
    })
    .on('finish', async queue => {
        const embed = new EmbedBuilder()
            .setColor('#a200ff')
            .setDescription('🏁 Queue finished! Thanks for listening.\n\n💡 Use `/join` to re-enable voice features.');
        queue.textChannel.send({ embeds: [embed] });

        // Clear stored voice channel if any
        const guildId = queue.textChannel.guildId;
        const client = queue.textChannel.client;
        if (client.musicVoiceChannel?.has(guildId)) {
            client.musicVoiceChannel.delete(guildId);
        }
    });

// Event Handling
const eventsPath = path.join(__dirname, 'src/events');
// Ensure directory exists to prevent crash if empty
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }
}

// Command Handling (Basic Loader)
const commandsPath = path.join(__dirname, 'src/commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        }
    }

}

client.once('ready', () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);

    let i = 0;
    setInterval(() => {
        // Dynamic Status Logic
        const activities = [];

        // 1. Voice Channel Status
        // Find if bot is in any voice channel
        let voiceStatus = 'Not in Voice 🔇';
        client.guilds.cache.forEach(guild => {
            const me = guild.members.me;
            if (me && me.voice.channel) {
                voiceStatus = `🎙️ ${me.voice.channel.name}`;
            }
        });
        activities.push({ name: voiceStatus, type: ActivityType.Listening });



        // 3. Static/Fun Statuses
        activities.push({ name: 'No Surprises - Radiohead', type: ActivityType.Listening });
        activities.push({ name: 'Your Dih', type: ActivityType.Playing });

        // Rotate
        const activity = activities[i % activities.length];
        client.user.setActivity(activity.name, { type: activity.type });
        i++;
    }, 5000);
});

client.login(process.env.DISCORD_TOKEN);
