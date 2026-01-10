const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Get yt-dlp path - use system yt-dlp on Linux, package binary on Windows
let ytDlpPath;
if (process.platform === 'win32') {
    ytDlpPath = path.join(__dirname, '../../node_modules/@distube/yt-dlp/bin/yt-dlp.exe');
} else {
    // On Linux (Railway), use system-installed yt-dlp
    ytDlpPath = 'yt-dlp';
}

console.log(`[Download] Platform: ${process.platform}, yt-dlp path: ${ytDlpPath}`);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dl')
        .setDescription('📥 Download video dari berbagai platform (TikTok, FB, IG, dll)')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('Link video yang mau di-download')
                .setRequired(true)
        )
        .addBooleanOption(option =>
            option.setName('audio')
                .setDescription('Download audio saja? (MP3)')
                .setRequired(false)
        ),

    async execute(interaction) {
        const url = interaction.options.getString('url');
        const audioOnly = interaction.options.getBoolean('audio') || false;

        await interaction.deferReply();

        // Create temp directory if doesn't exist
        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const outputFile = path.join(tempDir, `dl_${interaction.id}`);

        try {
            // Build yt-dlp command (8MB limit for Discord webhook)
            let command;
            if (audioOnly) {
                command = `"${ytDlpPath}" -x --audio-format mp3 -o "${outputFile}.%(ext)s" --no-playlist --max-filesize 8M "${url}"`;
            } else {
                command = `"${ytDlpPath}" -f "bestvideo[filesize<8M]+bestaudio/best[filesize<8M]/best" --merge-output-format mp4 -o "${outputFile}.%(ext)s" --no-playlist "${url}"`;
            }

            // Get video info first
            const infoCommand = `"${ytDlpPath}" --dump-json --no-playlist "${url}"`;
            let videoInfo = null;

            try {
                const { stdout } = await execAsync(infoCommand, { timeout: 30000 });
                videoInfo = JSON.parse(stdout);
            } catch (e) {
                console.log('Could not get video info:', e.message);
            }

            // Download the video
            await execAsync(command, { timeout: 120000 }); // 2 minute timeout

            // Find the downloaded file
            const files = fs.readdirSync(tempDir);
            const downloadedFile = files.find(f => f.startsWith(`dl_${interaction.id}`));

            if (!downloadedFile) {
                throw new Error('Download gagal - file tidak ditemukan');
            }

            const filePath = path.join(tempDir, downloadedFile);
            const stats = fs.statSync(filePath);
            const sizeInMB = stats.size / (1024 * 1024);

            // Check file size (Discord webhook limit is ~8MB, regular bot is 25MB)
            if (sizeInMB > 8) {
                // Clean up
                fs.unlinkSync(filePath);
                throw new Error(`File terlalu besar (${sizeInMB.toFixed(1)}MB). Max 8MB untuk upload Discord.`);
            }

            // Create attachment
            const attachment = new AttachmentBuilder(filePath, {
                name: audioOnly ? 'audio.mp3' : 'video.mp4'
            });

            // Platform colors
            const platformColors = {
                'tiktok': '#000000',
                'facebook': '#1877F2',
                'instagram': '#E4405F',
                'twitter': '#1DA1F2',
                'youtube': '#FF0000',
                'reddit': '#FF4500'
            };

            const platform = videoInfo?.extractor?.toLowerCase() || 'unknown';
            const embedColor = platformColors[platform] || '#a200ff';
            const caption = videoInfo?.title || videoInfo?.description || '';

            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setAuthor({
                    name: platform.charAt(0).toUpperCase() + platform.slice(1),
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setFooter({ text: `${sizeInMB.toFixed(1)}MB` });

            // Add truncated caption
            if (caption.length > 0) {
                const truncated = caption.length > 200 ? caption.substring(0, 200) + '...' : caption;
                embed.setDescription(truncated);
            }

            // Source link button
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('🔗 Source')
                    .setStyle(ButtonStyle.Link)
                    .setURL(url)
            );

            await interaction.editReply({
                embeds: [embed],
                files: [attachment],
                components: [row]
            });

            // Clean up temp file
            fs.unlinkSync(filePath);

        } catch (error) {
            console.error('Download error:', error);

            // Clean up any temp files
            try {
                const files = fs.readdirSync(tempDir);
                files.filter(f => f.startsWith(`dl_${interaction.id}`)).forEach(f => {
                    fs.unlinkSync(path.join(tempDir, f));
                });
            } catch (e) { }

            let errorMsg = error.message;
            if (errorMsg.includes('Unsupported URL')) {
                errorMsg = 'URL tidak didukung atau video bersifat private.';
            } else if (errorMsg.includes('Video unavailable')) {
                errorMsg = 'Video tidak tersedia atau sudah dihapus.';
            } else if (errorMsg.includes('filesize')) {
                errorMsg = 'Video terlalu besar (max 25MB).';
            }

            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription(`❌ Error: ${errorMsg.substring(0, 500)}`)
                ]
            });
        }
    }
};
