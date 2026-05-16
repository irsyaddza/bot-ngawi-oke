// Guild Create Event - Triggered when bot joins a new server
const { EmbedBuilder } = require('discord.js');
const { initGuildDefaults } = require('../utils/settingsDB');

module.exports = {
    name: 'guildCreate',
    once: false,

    async execute(guild) {
        console.log(`[Guild] ✅ Joined new server!`);
        console.log(`[Guild] 📛 Name: ${guild.name}`);
        console.log(`[Guild] 🆔 ID: ${guild.id}`);
        console.log(`[Guild] 👥 Members: ${guild.memberCount}`);
        console.log(`[Guild] 👑 Owner: ${guild.ownerId}`);

        // Initialize default settings for this guild
        try {
            initGuildDefaults(guild.id);
            console.log(`[Guild] ⚙️ Default settings initialized`);
        } catch (error) {
            console.error(`[Guild] Failed to init defaults:`, error);
        }

        // Try to send welcome message to system channel
        try {
            const systemChannel = guild.systemChannel;
            if (systemChannel && systemChannel.permissionsFor(guild.members.me).has('SendMessages')) {
                const embed = new EmbedBuilder()
                    .setColor('#a200ff')
                    .setTitle('👋 Halo! Terima kasih sudah mengundang saya!')
                    .setDescription('Saya adalah bot serbaguna dengan berbagai fitur menarik.')
                    .addFields(
                        {
                            name: '🚀 Mulai Cepat',
                            value: 'Ketik `/cmd` untuk melihat daftar perintah yang tersedia.'
                        },
                        {
                            name: '🎵 Music',
                            value: 'Gunakan `/play` untuk memutar musik di voice channel.'
                        },
                        {
                            name: '🤖 AI Chat',
                            value: 'Mention saya untuk berbicara dengan AI!'
                        },
                        {
                            name: '⚙️ Konfigurasi',
                            value: 'Admin server dapat menggunakan `/logic` untuk mengatur AI model.'
                        }
                    )
                    .setThumbnail(guild.client.user.displayAvatarURL())
                    .setFooter({ text: `Server: ${guild.name}` })
                    .setTimestamp();

                await systemChannel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error(`[Guild] Failed to send welcome message:`, error.message);
        }
    }
};
