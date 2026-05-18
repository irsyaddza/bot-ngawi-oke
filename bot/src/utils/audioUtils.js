const { createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const { isBellEnabled, getBellFileName } = require('./bellSettings');

/**
 * Play an MP3 file from the assets folder
 * @param {import('@discordjs/voice').VoiceConnection} connection 
 * @param {string} fileName - Nama file MP3 (tanpa path)
 * @returns {Promise<void>}
 */
async function playMP3(connection, fileName) {
    if (!connection) {
        console.error('[AudioUtils] No connection provided');
        return;
    }

    try {
        const filePath = path.join(__dirname, '../assets', fileName);
        console.log(`[AudioUtils] Attempting to play: ${filePath}`);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error(`[AudioUtils] File not found: ${filePath}`);
            
            // List available files for debugging
            const assetsDir = path.join(__dirname, '../assets');
            const files = fs.readdirSync(assetsDir);
            console.log(`[AudioUtils] Available files: ${files.join(', ')}`);
            return;
        }

        const stats = fs.statSync(filePath);
        console.log(`[AudioUtils] File found: ${fileName} (${stats.size} bytes)`);

        const player = createAudioPlayer();
        const resource = createAudioResource(filePath);

        console.log('[AudioUtils] Subscribing player to connection...');
        connection.subscribe(player);
        
        console.log('[AudioUtils] Starting playback...');
        player.play(resource);

        // Return a promise that resolves when the audio finishes
        return new Promise((resolve) => {
            player.on(AudioPlayerStatus.Idle, () => {
                console.log('[AudioUtils] Playback finished (Idle)');
                resolve();
            });

            player.on('error', error => {
                console.error('[AudioUtils] MP3 playback error:', error);
                resolve(); // Continue anyway
            });

            // Timeout safety (max 30 seconds)
            setTimeout(() => {
                console.log('[AudioUtils] Playback timeout (30s)');
                resolve();
            }, 30000);
        });

    } catch (error) {
        console.error('[AudioUtils] Failed to play MP3:', error);
    }
}

/**
 * Play MP3 then wait for it to finish
 * @param {import('@discordjs/voice').VoiceConnection} connection 
 * @param {string} fileName - Nama file MP3
 */
async function playMP3AndWait(connection, fileName) {
    await playMP3(connection, fileName);
}

/**
 * Play bell for a guild if enabled
 * @param {import('@discordjs/voice').VoiceConnection} connection 
 * @param {string} guildId 
 */
async function playBellIfEnabled(connection, guildId) {
    if (!isBellEnabled(guildId)) {
        return;
    }
    
    const bellFileName = getBellFileName(guildId);
    await playMP3AndWait(connection, bellFileName);
}

module.exports = {
    playMP3,
    playMP3AndWait,
    playBellIfEnabled
};
