const config = require('./src/config');
const { Client, GatewayIntentBits, Collection, ActivityType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Lavalink/Kazagumo Music Manager
const { initMusicManager } = require('./src/utils/lavalinkManager');

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

// Event Handling (load before ready to register handlers)
const eventsPath = path.join(__dirname, 'src/events');
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

// Command Handling
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

// Initialize Kazagumo when client is ready
client.once('ready', () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);

    // Initialize Lavalink Music Manager
    client.kazagumo = initMusicManager(client);

    // Kazagumo Player Events
    client.kazagumo.on('playerStart', (player, track) => {
        const embed = new EmbedBuilder()
            .setColor('#a200ff')
            .setTitle('🎶 Now Playing')
            .setDescription(`**[${track.title}](${track.uri})**`)
            .addFields(
                { name: '⏱️ Duration', value: formatDuration(track.length), inline: true },
                { name: '👤 Author', value: track.author || 'Unknown', inline: true },
                { name: '🎵 Source', value: track.sourceName || 'Unknown', inline: true }
            )
            .setThumbnail(track.thumbnail || null);

        const channel = client.channels.cache.get(player.textId);
        if (channel) channel.send({ embeds: [embed] });
    });

    client.kazagumo.on('playerEnd', (player) => {
        // Queue continues automatically
    });

    client.kazagumo.on('playerEmpty', (player) => {
        const embed = new EmbedBuilder()
            .setColor('#a200ff')
            .setDescription('🏁 Queue finished! Thanks for listening.\n\n💡 Use `/join` to re-enable voice features.');

        const channel = client.channels.cache.get(player.textId);
        if (channel) channel.send({ embeds: [embed] });

        player.destroy();
    });

    client.kazagumo.on('playerError', (player, error) => {
        console.error('[Player Error]:', error);
        const channel = client.channels.cache.get(player.textId);
        if (channel) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(`⛔ Player Error: ${error.message || error}`);
            channel.send({ embeds: [embed] });
        }
    });

    client.kazagumo.on('playerResolveError', (player, track, message) => {
        console.error('[Resolve Error]:', message);
        const channel = client.channels.cache.get(player.textId);
        if (channel) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(`⛔ Could not resolve track: ${track.title}\n${message || ''}`);
            channel.send({ embeds: [embed] });
        }
    });

    // Rotating Status
    let i = 0;
    setInterval(() => {
        const activities = [];

        // Voice Channel Status
        let voiceStatus = 'Not in Voice 🔇';
        client.guilds.cache.forEach(guild => {
            const me = guild.members.me;
            if (me && me.voice.channel) {
                voiceStatus = `🎙️ ${me.voice.channel.name}`;
            }
        });
        activities.push({ name: voiceStatus, type: ActivityType.Listening });

        // Static/Fun Statuses
        activities.push({ name: 'No Surprises - Radiohead', type: ActivityType.Listening });
        activities.push({ name: 'Your Dih', type: ActivityType.Playing });

        // Rotate
        const activity = activities[i % activities.length];
        client.user.setActivity(activity.name, { type: activity.type });
        i++;
    }, 5000);
});

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
    console.error('[Unhandled Rejection]:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('[Uncaught Exception]:', error);
});

if (!config.token) {
    console.error('CRITICAL: Token is missing. Please check your .env file.');
    process.exit(1);
}

// Log startup environment
console.log(`[Startup] Running in ${config.env} mode`);
client.login(config.token);
