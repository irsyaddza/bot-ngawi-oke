require('dotenv').config();
const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');

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
        activities.push({ name: 'Satru - Denny Caknan', type: ActivityType.Listening });
        activities.push({ name: 'Kokang mas Amba', type: ActivityType.Playing });

        // Rotate
        const activity = activities[i % activities.length];
        client.user.setActivity(activity.name, { type: activity.type });
        i++;
    }, 5000);
});

client.login(process.env.DISCORD_TOKEN);
