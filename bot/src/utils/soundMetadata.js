const fs = require('fs');
const path = require('path');

// Path to store sound metadata
const dataDir = path.join(__dirname, '../../data');
const metadataFile = path.join(dataDir, 'soundMetadata.json');

// Ensure data directory exists with proper permissions
function ensureDirectoryExists() {
    try {
        if (!fs.existsSync(dataDir)) {
            console.log(`[SoundMetadata] Creating data directory: ${dataDir}`);
            fs.mkdirSync(dataDir, { recursive: true, mode: 0o777 });
        }

        // Ensure write permissions
        try {
            fs.accessSync(dataDir, fs.constants.W_OK);
        } catch {
            console.warn(`[SoundMetadata] Directory not writable, attempting to fix: ${dataDir}`);
            try {
                fs.chmodSync(dataDir, 0o777);
                console.log('[SoundMetadata] Fixed directory permissions');
            } catch (chmodError) {
                console.warn('[SoundMetadata] Could not fix permissions:', chmodError);
            }
        }
    } catch (error) {
        console.error('[SoundMetadata] Failed to ensure directory:', error);
    }
}

// Initialize on module load
ensureDirectoryExists();

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
    saveMetadata
};
