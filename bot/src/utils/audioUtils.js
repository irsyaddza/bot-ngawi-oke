const { createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const fs = require('fs');
const path = require('path');
const { isBellEnabled, getBellFileName } = require('./bellSettings');
const { getSoundsDir } = require('./soundMetadata');

/**
 * Resolve a sound file from available directories.
 * Priority: 1) data/sounds/ (uploaded files), 2) src/assets/ (built-in files)
 * @param {string} fileName - File name (without directory path)
 * @returns {string|null} Full path to the file, or null if not found
 */
function resolveAudioFile(fileName) {
    // Check data/sounds/ first (uploaded files, persistent)
    const soundsPath = path.join(getSoundsDir(), fileName);
    if (fs.existsSync(soundsPath)) {
        return soundsPath;
    }

    // Fallback to src/assets/ (built-in sounds like bell1.mp3, tutturu.mp3)
    const assetsPath = path.join(__dirname, '../assets', fileName);
    if (fs.existsSync(assetsPath)) {
        return assetsPath;
    }

    return null;
}

/**
 * Play an MP3 file — automatically resolves from data/sounds/ or src/assets/
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
        const filePath = resolveAudioFile(fileName);
        console.log(`[AudioUtils] Attempting to play: ${fileName}`);

        // Check if file exists
        if (!filePath) {
            console.error(`[AudioUtils] File not found in any location: ${fileName}`);
            
            // List available files for debugging
            const soundsDir = getSoundsDir();
            const assetsDir = path.join(__dirname, '../assets');
            const soundFiles = fs.existsSync(soundsDir) ? fs.readdirSync(soundsDir) : [];
            const assetFiles = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
            console.log(`[AudioUtils] Files in data/sounds/: ${soundFiles.join(', ') || '(empty)'}`);
            console.log(`[AudioUtils] Files in src/assets/: ${assetFiles.join(', ')}`);
            return;
        }

        const stats = fs.statSync(filePath);
        console.log(`[AudioUtils] File found: ${filePath} (${stats.size} bytes)`);

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
