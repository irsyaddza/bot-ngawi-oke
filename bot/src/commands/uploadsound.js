const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { addSound, getSounds } = require('../utils/soundMetadata');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uploadsound')
        .setDescription('📤 Upload custom sound file ke soundboard')
        .addAttachmentOption(option =>
            option.setName('file')
                .setDescription('File MP3/WAV/OGG (max 20MB)')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Nama display untuk sound (contoh: Alarm, Notif, dll)')
                .setRequired(true)
                .setMaxLength(50)
        )
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Deskripsi singkat (opsional)')
                .setRequired(false)
                .setMaxLength(200)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const attachment = interaction.options.getAttachment('file');
        const soundName = interaction.options.getString('name');
        const description = interaction.options.getString('description') || '';

        // Validasi tipe file
        const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'];
        const maxSize = 20 * 1024 * 1024; // 20MB

        if (!allowedTypes.includes(attachment.contentType) || attachment.size > maxSize) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription(`❌ Error!\n\n• Tipe file harus: MP3, WAV, atau OGG\n• Ukuran max: 20MB\n• File Anda: ${attachment.contentType} (${(attachment.size / 1024 / 1024).toFixed(2)}MB)`)
                ],
                ephemeral: true
            });
        }

        // Cek jumlah sounds yang sudah diupload
        const existingSounds = getSounds(interaction.guild.id);
        if (existingSounds.length >= 50) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Yellow')
                        .setDescription(`⚠️ Limit tercapai!\n\nSoundboard hanya mendukung max 50 sounds per server.`)
                ],
                ephemeral: true
            });
        }

        await interaction.deferReply();

        try {
            // Generate nama file unik
            const ext = attachment.name.split('.').pop().toLowerCase();
            const fileName = `${soundName.replace(/\s+/g, '_')}_${Date.now()}.${ext}`;
            const filePath = path.join(__dirname, '../assets', fileName);

            // Download file dari Discord CDN
            await downloadFile(attachment.url, filePath);

            // Verifikasi file berhasil disimpan
            if (!fs.existsSync(filePath)) {
                throw new Error('File tidak berhasil disimpan ke disk');
            }

            // Tambah metadata
            const sound = addSound(
                interaction.guild.id,
                fileName,
                soundName,
                interaction.user.id,
                description
            );

            // Kirim konfirmasi
            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Green')
                        .setTitle('✅ Sound Berhasil Diupload!')
                        .setDescription(`**Nama:** ${soundName}\n**File:** ${fileName}\n**Ukuran:** ${(attachment.size / 1024 / 1024).toFixed(2)}MB`)
                        .addFields([
                            {
                                name: '📝 Deskripsi',
                                value: description || '(Tidak ada)',
                                inline: false
                            },
                            {
                                name: '🎧 Akses',
                                value: 'Soundboard di website admin sudah ter-update!',
                                inline: false
                            },
                            {
                                name: '📊 Total Sounds',
                                value: `${existingSounds.length + 1}/50`,
                                inline: true
                            }
                        ])
                        .setFooter({ text: `ID: ${sound.id}` })
                ]
            });

        } catch (error) {
            console.error('Upload Error:', error);
            
            // Hapus file jika ada yang tersimpan tapi terjadi error
            const filePath = path.join(__dirname, '../assets', fileName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription(`❌ Gagal upload sound!\n\n\`\`\`${error.message}\`\`\``)
                ]
            });
        }
    }
};

/**
 * Download file dari URL dan simpan ke path
 */
async function downloadFile(url, filePath) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}`));
                return;
            }

            const fileStream = fs.createWriteStream(filePath);
            response.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                resolve();
            });

            fileStream.on('error', (err) => {
                fs.unlink(filePath, () => {});
                reject(err);
            });
        }).on('error', reject);
    });
}
