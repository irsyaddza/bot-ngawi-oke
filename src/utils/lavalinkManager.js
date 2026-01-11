// Lavalink/Kazagumo Music Manager
// Handles connection to Lavalink nodes and provides player management

const { Connectors } = require('shoukaku');
const { Kazagumo } = require('kazagumo');

// Lavalink node configuration - Multiple nodes for failover
const Nodes = [
    {
        name: 'Lavalink-Ajie',
        url: 'lava-v4.ajieblogs.eu.org:443',
        auth: 'https://dsc.gg/ajidevserver',
        secure: true
    },
    {
        name: 'Lavalink-Muzykant',
        url: 'lavalink_v4.muzykant.xyz:443',
        auth: 'https://discord.gg/v6sdrD9kPh',
        secure: true
    }
];

/**
 * Initialize Kazagumo music manager
 * @param {Client} client - Discord.js client
 * @returns {Kazagumo} Kazagumo instance
 */
function initMusicManager(client) {
    const kazagumo = new Kazagumo(
        {
            defaultSearchEngine: 'youtube',
            // CRITICAL: This is required for voice connection
            send: (guildId, payload) => {
                const guild = client.guilds.cache.get(guildId);
                if (guild) guild.shard.send(payload);
            }
        },
        new Connectors.DiscordJS(client),
        Nodes,
        {
            reconnectTries: 5,
            reconnectInterval: 5000,
            restTimeout: 60000,
            moveOnDisconnect: false,
            resume: false,
            resumeTimeout: 30
        }
    );

    // Shoukaku (Lavalink) Events
    kazagumo.shoukaku.on('ready', (name) => {
        console.log(`[Lavalink] Node ${name} is ready!`);
    });

    kazagumo.shoukaku.on('error', (name, error) => {
        console.error(`[Lavalink] Node ${name} error:`, error.message);
    });

    kazagumo.shoukaku.on('close', (name, code, reason) => {
        console.warn(`[Lavalink] Node ${name} closed (${code}): ${reason || 'No reason'}`);
    });

    kazagumo.shoukaku.on('disconnect', (name, count) => {
        // Destroy players when node disconnects
        const players = [...kazagumo.shoukaku.players.values()].filter(p => p.node.name === name);
        players.forEach(player => {
            kazagumo.destroyPlayer(player.guildId);
            player.destroy();
        });
        console.warn(`[Lavalink] Node ${name} disconnected`);
    });

    kazagumo.shoukaku.on('debug', (name, info) => {
        console.log(`[Lavalink Debug] ${name}: ${info}`);
    });

    return kazagumo;
}

module.exports = { initMusicManager };
