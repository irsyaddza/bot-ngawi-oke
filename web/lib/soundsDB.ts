import fs from 'fs';
import path from 'path';

// Get the shared data directory (one level up from web folder)
export const getDataDir = () => {
    if (process.env.DATABASE_PATH) return process.env.DATABASE_PATH;
    return path.join(process.cwd(), '../data');
};

const metadataFile = path.join(getDataDir(), 'soundMetadata.json');

interface Sound {
    id: string;
    filename: string;
    name: string;
    uploadedBy: string;
    uploadedAt: string;
    description: string;
    playCount: number;
    lastPlayed: string | null;
}

interface SoundMetadata {
    [guildId: string]: {
        sounds: Sound[];
    };
}

function loadMetadata(): SoundMetadata {
    try {
        if (fs.existsSync(metadataFile)) {
            const data = fs.readFileSync(metadataFile, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading sound metadata:', error);
    }
    return {};
}

function ensureDirectoryExists(): boolean {
    try {
        const dataDir = getDataDir();
        
        if (!fs.existsSync(dataDir)) {
            console.log(`[SoundsDB] Creating data directory: ${dataDir}`);
            fs.mkdirSync(dataDir, { recursive: true, mode: 0o777 });
        }

        // Ensure write permissions
        try {
            fs.accessSync(dataDir, fs.constants.W_OK);
        } catch {
            console.warn(`[SoundsDB] Directory exists but not writable, attempting to fix permissions: ${dataDir}`);
            // Try to fix permissions (this might fail in some Docker setups)
            try {
                fs.chmodSync(dataDir, 0o777);
                console.log(`[SoundsDB] Fixed directory permissions`);
            } catch (chmodError) {
                console.warn(`[SoundsDB] Could not fix permissions:`, chmodError);
            }
        }

        return true;
    } catch (error) {
        console.error('[SoundsDB] Failed to ensure directory exists:', error);
        return false;
    }
}

function saveMetadata(metadata: SoundMetadata): void {
    try {
        // Ensure directory exists first
        if (!ensureDirectoryExists()) {
            throw new Error('Failed to create/access data directory');
        }

        // Write to a temporary file first, then rename (atomic operation)
        const tempFile = metadataFile + '.tmp';
        const jsonContent = JSON.stringify(metadata, null, 2);

        try {
            fs.writeFileSync(tempFile, jsonContent, { mode: 0o666 });
            
            // If temp file write succeeded, replace original
            if (fs.existsSync(metadataFile)) {
                fs.unlinkSync(metadataFile);
            }
            fs.renameSync(tempFile, metadataFile);
            
            console.log('[SoundsDB] Successfully saved metadata');
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
        console.error('[SoundsDB] Error saving sound metadata:', error);
        // Don't throw - allow app to continue even if metadata save fails
        // This prevents hard crashes, but changes won't persist
    }
}

export function getSounds(guildId: string): Sound[] {
    const metadata = loadMetadata();
    return metadata[guildId]?.sounds || [];
}

export function getSound(guildId: string, soundId: string): Sound | null {
    const sounds = getSounds(guildId);
    return sounds.find(s => s.id === soundId) || null;
}

export function deleteSound(guildId: string, soundId: string, assetPath?: string): boolean {
    const metadata = loadMetadata();

    if (!metadata[guildId]?.sounds) {
        return false;
    }

    const soundIndex = metadata[guildId].sounds.findIndex(s => s.id === soundId);
    if (soundIndex === -1) {
        return false;
    }

    const sound = metadata[guildId].sounds[soundIndex];

    // Delete the audio file if path provided
    if (assetPath) {
        try {
            const filePath = path.join(assetPath, sound.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error('Error deleting sound file:', error);
        }
    }

    // Remove from metadata
    metadata[guildId].sounds.splice(soundIndex, 1);
    saveMetadata(metadata);
    return true;
}

export function renameSound(guildId: string, soundId: string, newName: string): boolean {
    const metadata = loadMetadata();

    if (!metadata[guildId]?.sounds) {
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

export function updateDescription(guildId: string, soundId: string, description: string): boolean {
    const metadata = loadMetadata();

    if (!metadata[guildId]?.sounds) {
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

export function recordPlayback(guildId: string, soundId: string): boolean {
    const metadata = loadMetadata();

    if (!metadata[guildId]?.sounds) {
        return false;
    }

    const sound = metadata[guildId].sounds.find(s => s.id === soundId);
    if (sound) {
        sound.playCount = (sound.playCount || 0) + 1;
        sound.lastPlayed = new Date().toISOString();
        saveMetadata(metadata);
        return true;
    }
    return false;
}
