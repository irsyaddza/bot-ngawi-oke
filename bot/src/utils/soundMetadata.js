const fs = require('fs');
const path = require('path');

// Path to store sound metadata — uses DATABASE_PATH env var (volume-mounted /app/data)
const dataDir = process.env.DATABASE_PATH || path.join(__dirname, '../../data');
const metadataFile = path.join(dataDir, 'soundMetadata.json');

// Persistent directory for uploaded sound files (inside the data volume)
const soundsDir = path.join(dataDir, 'sounds');

/**
 * Get the directory path where uploaded sound files are stored.
 * This is inside the data volume so files persist across Docker restarts.
 * @returns {string} Absolute path to sounds directory
 */
function getSoundsDir() {
    return soundsDir;
}

// Ensure data and sounds directories exist with proper permissions
function ensureDirectoryExists() {
    try {
        for (const dir of [dataDir, soundsDir]) {
            if (!fs.existsSync(dir)) {
                console.log(`[SoundMetadata] Creating directory: ${dir}`);
                fs.mkdirSync(dir, { recursive: true, mode: 0o777 });
            }

            // Ensure write permissions
            try {
                fs.accessSync(dir, fs.constants.W_OK);
            } catch {
                console.warn(`[SoundMetadata] Directory not writable, attempting to fix: ${dir}`);
                try {
                    fs.chmodSync(dir, 0o777);
                    console.log(`[SoundMetadata] Fixed directory permissions for: ${dir}`);
                } catch (chmodError) {
                    console.warn('[SoundMetadata] Could not fix permissions:', chmodError);
                }
            }
        }
    } catch (error) {
        console.error('[SoundMetadata] Failed to ensure directory:', error);
    }
}

// Load metadata from file
function loadMetadata() {
    try {
        if (fs.existsSync(metadataFile)) {
            const data = fs.readFileSync(metadataFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('[SoundMetadata] Error loading metadata:', error);
    }
    return {};
}

// Save metadata to file with atomic write
function saveMetadata(metadata) {
    try {
        ensureDirectoryExists();
        
        // Write to temp file first, then rename (atomic operation)
        const tempFile = metadataFile + '.tmp';
        const jsonContent = JSON.stringify(metadata, null, 2);

        try {
            fs.writeFileSync(tempFile, jsonContent, { mode: 0o666 });
            
            // If temp write succeeded, replace original
            if (fs.existsSync(metadataFile)) {
                fs.unlinkSync(metadataFile);
            }
            fs.renameSync(tempFile, metadataFile);
            
            console.log('[SoundMetadata] Successfully saved metadata');
        } catch (writeError) {
            // Cleanup temp file if it exists
            try {
                if (fs.existsSync(tempFile)) {
                    fs.unlinkSync(tempFile);
                }
            } catch {}
            throw writeError;
        }
    } catch (error) {
        console.error('[SoundMetadata] Error saving metadata:', error);
    }
}

/**
 * Scan soundMetadata.json and remove any sound entries whose audio files 
 * do not exist in either data/sounds/ or src/assets/.
 */
function cleanupMissingSounds() {
    try {
        const metadata = loadMetadata();
        let changed = false;

        for (const guildId in metadata) {
            if (metadata[guildId] && metadata[guildId].sounds) {
                const initialLength = metadata[guildId].sounds.length;
                metadata[guildId].sounds = metadata[guildId].sounds.filter(sound => {
                    const fileInSounds = path.join(soundsDir, sound.filename);
                    const fileInAssets = path.join(__dirname, '../assets', sound.filename);
                    const exists = fs.existsSync(fileInSounds) || fs.existsSync(fileInAssets);
                    if (!exists) {
                        console.log(`[SoundMetadata] Removing missing sound from metadata: ${sound.name} (${sound.filename})`);
                    }
                    return exists;
                });

                if (metadata[guildId].sounds.length !== initialLength) {
                    changed = true;
                }
            }
        }

        if (changed) {
            saveMetadata(metadata);
            console.log('[SoundMetadata] Cleaned up missing sounds from metadata file');
        }
    } catch (error) {
        console.error('[SoundMetadata] Error cleaning up missing sounds:', error);
    }
}

// Initialize and auto-cleanup on module load
ensureDirectoryExists();
cleanupMissingSounds();

/**
 * Add a new sound to metadata
 * @param {string} guildId 
 * @param {string} fileName 
 * @param {string} soundName - Display name for the sound
 * @param {string} uploadedBy - User ID who uploaded
 * @param {string} description - Optional description
 * @returns {object} The created sound object
 */
function addSound(guildId, fileName, soundName, uploadedBy, description = '') {
    const metadata = loadMetadata();
    
    if (!metadata[guildId]) {
        metadata[guildId] = { sounds: [] };
    }

    const soundId = `sound_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sound = {
        id: soundId,
        filename: fileName,
        name: soundName,
        uploadedBy: uploadedBy,
        uploadedAt: new Date().toISOString(),
        description: description,
        playCount: 0,
        lastPlayed: null
    };

    metadata[guildId].sounds.push(sound);
    saveMetadata(metadata);
    return sound;
}

/**
 * Get all sounds for a guild
 * @param {string} guildId 
 * @returns {array}
 */
function getSounds(guildId) {
    const metadata = loadMetadata();
    if (metadata[guildId] && metadata[guildId].sounds) {
        return metadata[guildId].sounds;
    }
    return [];
}

/**
 * Get a specific sound by ID
 * @param {string} guildId 
 * @param {string} soundId 
 * @returns {object|null}
 */
function getSound(guildId, soundId) {
    const sounds = getSounds(guildId);
    return sounds.find(s => s.id === soundId) || null;
}

/**
 * Delete a sound by ID
 * @param {string} guildId 
 * @param {string} soundId 
 * @returns {boolean} Success status
 */
function deleteSound(guildId, soundId) {
    const metadata = loadMetadata();
    
    if (!metadata[guildId] || !metadata[guildId].sounds) {
        return false;
    }

    const index = metadata[guildId].sounds.findIndex(s => s.id === soundId);
    if (index !== -1) {
        metadata[guildId].sounds.splice(index, 1);
        saveMetadata(metadata);
        return true;
    }
    return false;
}

/**
 * Update sound play count and last played time
 * @param {string} guildId 
 * @param {string} soundId 
 */
function recordPlayback(guildId, soundId) {
    const metadata = loadMetadata();
    
    if (!metadata[guildId] || !metadata[guildId].sounds) {
        return;
    }

    const sound = metadata[guildId].sounds.find(s => s.id === soundId);
    if (sound) {
        sound.playCount = (sound.playCount || 0) + 1;
        sound.lastPlayed = new Date().toISOString();
        saveMetadata(metadata);
    }
}

/**
 * Rename a sound
 * @param {string} guildId 
 * @param {string} soundId 
 * @param {string} newName 
 * @returns {boolean} Success status
 */
function renameSound(guildId, soundId, newName) {
    const metadata = loadMetadata();
    
    if (!metadata[guildId] || !metadata[guildId].sounds) {
        return false;
    }

    const sound = metadata[guildId].sounds.find(s => s.id === soundId);
    if (sound) {
        sound.name = newName;
        saveMetadata(metadata);
        return true;
    }
    return false;
}

/**
 * Update sound description
 * @param {string} guildId 
 * @param {string} soundId 
 * @param {string} description 
 * @returns {boolean} Success status
 */
function updateDescription(guildId, soundId, description) {
    const metadata = loadMetadata();
    
    if (!metadata[guildId] || !metadata[guildId].sounds) {
        return false;
    }

    const sound = metadata[guildId].sounds.find(s => s.id === soundId);
    if (sound) {
        sound.description = description;
        saveMetadata(metadata);
        return true;
    }
    return false;
}

module.exports = {
    addSound,
    getSounds,
    getSound,
    deleteSound,
    recordPlayback,
    renameSound,
    updateDescription,
    loadMetadata,
    saveMetadata,
    getSoundsDir
};
