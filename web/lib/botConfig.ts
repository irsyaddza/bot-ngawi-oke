import fs from 'fs';
import path from 'path';

/**
 * Read bot config to get guildId
 */
export function getBotGuildId(): string | null {
    try {
        const configPath = path.join(process.cwd(), '../bot/src/config.js');
        if (!fs.existsSync(configPath)) {
            return null;
        }

        // Read config.js and parse it
        const configContent = fs.readFileSync(configPath, 'utf8');
        
        // Extract guildId using regex - handles both dev and production
        const guildIdMatch = configContent.match(/guildId:\s*(?:.*?process\.env\.DEV_GUILD_ID|.*?process\.env\.GUILD_ID|['"]([\w]+)['"])/);
        
        // Try to get from environment directly
        const env = process.env.APP_ENV || 'production';
        const envGuildId = env === 'development' 
            ? process.env.DEV_GUILD_ID 
            : process.env.GUILD_ID;
        
        return envGuildId || null;
    } catch (error) {
        console.error('Error reading bot config:', error);
        return null;
    }
}
