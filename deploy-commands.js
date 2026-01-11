const { REST, Routes } = require('discord.js');
const config = require('./src/config');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'src/commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    commands.push(command.data.toJSON());
}

if (!config.token) {
    console.error('CRITICAL: Token is missing. Please check your .env file.');
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
    try {
        console.log(`[Env: ${config.env}] Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands for Guild: ${config.guildId}`);
    } catch (error) {
        console.error(error);
    }
})();
