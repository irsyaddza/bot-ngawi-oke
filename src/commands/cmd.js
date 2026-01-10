const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cmd')
        .setDescription('📋 Lihat semua command yang tersedia'),

    async execute(interaction) {
        // Create category selector
        const selectMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('cmd_category')
                    .setPlaceholder('📂 Pilih kategori')
                    .addOptions([
                        { label: '🏠 Overview', value: 'overview', description: 'Lihat semua kategori', emoji: '📋' },
                        { label: '🛡️ Admin', value: 'admin', description: 'Moderation commands', emoji: '⚔️' },
                        { label: '🎉 Fun', value: 'fun', description: 'Interaksi seru', emoji: '🎭' },
                        { label: '🎵 Music', value: 'music', description: 'Music player', emoji: '🎶' },
                        { label: '🔊 Voice', value: 'voice', description: 'Voice & TTS', emoji: '🎙️' },
                        { label: '⚙️ Utility', value: 'utility', description: 'Tools & settings', emoji: '🔧' }
                    ])
            );

        const embed = createOverviewEmbed();

        await interaction.reply({
            embeds: [embed],
            components: [selectMenu]
        });
    }
};

// Overview Embed
function createOverviewEmbed() {
    return new EmbedBuilder()
        .setColor('#a200ff')
        .setTitle('📋 Rusdi Bot Commands')
        .setDescription('Pilih kategori di bawah untuk melihat detail command!')
        .addFields(
            {
                name: '🛡️ Admin (via @bot)',
                value: '`mute` `unmute` `kick` `ban` `hapus`',
                inline: true
            },
            {
                name: '🎉 Fun (via @bot)',
                value: '`gampar` `slap` `kiss` `hug` `duel` `ship` `roast`',
                inline: true
            },
            {
                name: '🎵 Music (Slash)',
                value: '`/play` `/stop` `/queue` `/skip`',
                inline: true
            },
            {
                name: '🔊 Voice (Slash)',
                value: '`/join` `/changevoice` `/leave`',
                inline: true
            },
            {
                name: '⚙️ Utility (Slash)',
                value: '`/dashboard` `/dl` `/ping` `/auditlog`',
                inline: true
            },
            {
                name: '🤖 AI Chat',
                value: 'Mention @bot + pesan apapun',
                inline: true
            }
        )
        .setFooter({ text: 'Gunakan dropdown di bawah untuk detail!' })
        .setTimestamp();
}

// Admin Commands Embed
function createAdminEmbed() {
    return new EmbedBuilder()
        .setColor('#FF4500')
        .setTitle('🛡️ Admin Commands')
        .setDescription('Semua command admin via **@bot mention**')
        .addFields(
            { name: '🔇 Mute', value: '`@bot mute @user [waktu]`\nContoh: `@bot mute @user 10m`', inline: false },
            { name: '🔊 Unmute', value: '`@bot unmute @user`', inline: false },
            { name: '👢 Kick', value: '`@bot kick @user`', inline: false },
            { name: '🔨 Ban', value: '`@bot ban @user`', inline: false },
            { name: '🗑️ Purge', value: '`@bot hapus 10 pesan`\nMax 100 pesan', inline: false },
            { name: '📊 Server Info', value: '`@bot info server`', inline: false },
            { name: '👥 Member Count', value: '`@bot berapa member sekarang`', inline: false }
        )
        .setFooter({ text: '⚠️ Butuh permission yang sesuai!' });
}

// Fun Commands Embed
function createFunEmbed() {
    return new EmbedBuilder()
        .setColor('#FF69B4')
        .setTitle('🎉 Fun Commands')
        .setDescription('Interaksi seru via **@bot mention**')
        .addFields(
            { name: '🖐️ Gampar', value: '`@bot gampar @user`\nNampar ala Indonesia + GIF', inline: true },
            { name: '👋 Slap', value: '`@bot slap @user`\nSlap + GIF', inline: true },
            { name: '💋 Kiss', value: '`@bot kiss @user`\nKiss + GIF', inline: true },
            { name: '🤗 Hug', value: '`@bot hug @user`\nPeluk + GIF', inline: true },
            { name: '⚔️ Duel', value: '`@bot duel @user`\nRandom win/lose/draw', inline: true },
            { name: '💕 Ship', value: '`@bot ship @user1 @user2`\nLove calculator %', inline: true },
            { name: '🔥 Roast', value: '`@bot roast @user`\nAI roasting lucu', inline: false }
        );
}

// Music Commands Embed
function createMusicEmbed() {
    return new EmbedBuilder()
        .setColor('#1DB954')
        .setTitle('🎵 Music Commands')
        .setDescription('Slash commands untuk musik')
        .addFields(
            { name: '▶️ Play', value: '`/play [query/url]`\nPlay dari YouTube, Spotify, SoundCloud', inline: false },
            { name: '⏹️ Stop', value: '`/stop`\nStop & disconnect', inline: true },
            { name: '⏭️ Skip', value: '`/skip`\nSkip lagu', inline: true },
            { name: '📜 Queue', value: '`/queue`\nLihat antrian', inline: true },
            { name: '🔊 Volume', value: 'Gunakan tombol 🔉🔊', inline: true },
            { name: '🔁 Repeat', value: 'Gunakan tombol 🔁', inline: true },
            { name: '🔀 Shuffle', value: 'Gunakan tombol 🔀', inline: true }
        );
}

// Voice Commands Embed
function createVoiceEmbed() {
    return new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🔊 Voice Commands')
        .setDescription('Slash commands untuk voice & TTS')
        .addFields(
            { name: '🎤 Join', value: '`/join`\nBot join ke VC kamu', inline: true },
            { name: '🗣️ Change Voice', value: '`/changevoice`\nGanti suara TTS', inline: true },
            { name: '🔒 Voice Lock', value: '`/voicelock`\nKunci voice channel', inline: true },
        );
}

// Utility Commands Embed
function createUtilityEmbed() {
    return new EmbedBuilder()
        .setColor('#00FF88')
        .setTitle('⚙️ Utility Commands')
        .setDescription('Slash commands untuk tools & settings')
        .addFields(
            { name: '📊 Dashboard', value: '`/dashboard`\nLihat API usage & system stats', inline: true },
            { name: '📥 Download', value: '`/dl [url]`\nDownload video TikTok, IG, dll', inline: true },
            { name: '🏓 Ping', value: '`/ping`\nCek latency', inline: true },
            { name: '📋 Audit Log', value: '`/auditlog enable #channel`\nSetup audit log', inline: true },
            { name: '🧹 Clear Chat', value: '`/clearchat`\nReset chat AI history', inline: true },
            { name: '🧠 Logic', value: '`/logic [AI]`\nSwitch Gemini/DeepSeek', inline: true }
        );
}

// Export helper for interaction handler
module.exports.handleCmdSelect = async function (interaction) {
    const category = interaction.values[0];

    let embed;
    switch (category) {
        case 'admin':
            embed = createAdminEmbed();
            break;
        case 'fun':
            embed = createFunEmbed();
            break;
        case 'music':
            embed = createMusicEmbed();
            break;
        case 'voice':
            embed = createVoiceEmbed();
            break;
        case 'utility':
            embed = createUtilityEmbed();
            break;
        default:
            embed = createOverviewEmbed();
    }

    await interaction.update({ embeds: [embed] });
};
