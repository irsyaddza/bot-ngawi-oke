const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

/**
 * Parse admin command from message content
 * @param {string} content - Cleaned message content (without bot mention)
 * @param {import('discord.js').Message} message - Discord message object
 * @returns {object|null} - Parsed command object or null if not a command
 */
function parseAdminCommand(content, message) {
    const lowerContent = content.toLowerCase();

    // Get mentioned users (excluding the bot)
    const mentionedMembers = message.mentions.members?.filter(m => m.id !== message.client.user.id);
    const targetMember = mentionedMembers?.first();

    // --- SERVER INFO COMMANDS ---
    if (lowerContent.includes('info server') || lowerContent.includes('server info')) {
        return { action: 'server_info' };
    }

    if (lowerContent.includes('berapa member sekarang') || lowerContent.includes('member count') ||
        lowerContent.includes('berapa anggota sekarang') || lowerContent.includes('jumlah member')) {
        return { action: 'member_count' };
    }

    // --- MODERATION COMMANDS ---
    // Mute command: "@bot mute @user" or "@bot mute @user 10m"
    const muteMatch = lowerContent.match(/^mute\s+/);
    if (muteMatch && targetMember) {
        // Parse duration (default 5 minutes)
        const durationMatch = content.match(/(\d+)\s*(m|min|menit|h|jam|hour|d|hari|day)/i);
        let durationMs = 5 * 60 * 1000; // Default 5 minutes

        if (durationMatch) {
            const value = parseInt(durationMatch[1]);
            const unit = durationMatch[2].toLowerCase();
            if (unit.startsWith('h') || unit === 'jam') {
                durationMs = value * 60 * 60 * 1000;
            } else if (unit.startsWith('d') || unit === 'hari') {
                durationMs = value * 24 * 60 * 60 * 1000;
            } else {
                durationMs = value * 60 * 1000; // minutes
            }
        }

        return { action: 'mute', target: targetMember, duration: durationMs };
    }

    // Unmute command
    if (lowerContent.match(/^unmute\s+/) && targetMember) {
        return { action: 'unmute', target: targetMember };
    }

    // Kick command
    if (lowerContent.match(/^kick\s+/) && targetMember) {
        return { action: 'kick', target: targetMember };
    }

    // Ban command
    if (lowerContent.match(/^ban\s+/) && targetMember) {
        return { action: 'ban', target: targetMember };
    }

    // Purge/Delete messages command
    const purgeMatch = lowerContent.match(/(?:hapus|purge|delete)\s+(\d+)\s*(?:pesan|messages?)?/);
    if (purgeMatch) {
        const amount = Math.min(parseInt(purgeMatch[1]), 100); // Max 100
        return { action: 'purge', amount };
    }

    // Not a command
    return null;
}

/**
 * Execute admin command with permission checks
 * @param {object} command - Parsed command object
 * @param {import('discord.js').Message} message - Discord message object
 */
async function executeAdminCommand(command, message) {
    const { action, target, duration, amount } = command;

    try {
        switch (action) {
            case 'server_info':
                return await handleServerInfo(message);

            case 'member_count':
                return await handleMemberCount(message);

            case 'mute':
                return await handleMute(message, target, duration);

            case 'unmute':
                return await handleUnmute(message, target);

            case 'kick':
                return await handleKick(message, target);

            case 'ban':
                return await handleBan(message, target);

            case 'purge':
                return await handlePurge(message, amount);

            default:
                return null;
        }
    } catch (error) {
        console.error('Admin command error:', error);
        return message.reply(`❌ Error: ${error.message}`);
    }
}

// --- COMMAND HANDLERS ---

async function handleServerInfo(message) {
    const guild = message.guild;
    const owner = await guild.fetchOwner();

    const embed = new EmbedBuilder()
        .setTitle(`📊 Info Server: ${guild.name}`)
        .setThumbnail(guild.iconURL({ size: 256 }))
        .addFields(
            { name: '👑 Owner', value: owner.user.tag, inline: true },
            { name: '👥 Members', value: `${guild.memberCount}`, inline: true },
            { name: '📅 Dibuat', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
            { name: '💬 Channels', value: `${guild.channels.cache.size}`, inline: true },
            { name: '🎭 Roles', value: `${guild.roles.cache.size}`, inline: true },
            { name: '😀 Emojis', value: `${guild.emojis.cache.size}`, inline: true }
        )
        .setColor('Blue')
        .setFooter({ text: `ID: ${guild.id}` });

    return message.reply({ embeds: [embed] });
}

async function handleMemberCount(message) {
    const guild = message.guild;
    const members = await guild.members.fetch();
    const humans = members.filter(m => !m.user.bot).size;
    const bots = members.filter(m => m.user.bot).size;

    return message.reply(`👥 **${guild.name}** memiliki **${guild.memberCount}** anggota.\n` +
        `├ 🧑 Manusia: **${humans}**\n` +
        `└ 🤖 Bot: **${bots}**`);
}

async function handleMute(message, target, duration) {
    // Permission check
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return message.reply('❌ Kamu tidak punya izin untuk mute member.');
    }

    // Check if bot can moderate target
    if (!target.moderatable) {
        return message.reply('❌ Aku tidak bisa mute member ini. Role-nya mungkin lebih tinggi.');
    }

    const durationText = formatDuration(duration);
    await target.timeout(duration, `Dimute oleh ${message.author.tag}`);

    return message.reply(`🔇 **${target.user.tag}** telah di-mute selama **${durationText}**.`);
}

async function handleUnmute(message, target) {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return message.reply('❌ Kamu tidak punya izin untuk unmute member.');
    }

    if (!target.moderatable) {
        return message.reply('❌ Aku tidak bisa unmute member ini.');
    }

    await target.timeout(null, `Di-unmute oleh ${message.author.tag}`);

    return message.reply(`🔊 **${target.user.tag}** telah di-unmute.`);
}

async function handleKick(message, target) {
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
        return message.reply('❌ Kamu tidak punya izin untuk kick member.');
    }

    if (!target.kickable) {
        return message.reply('❌ Aku tidak bisa kick member ini. Role-nya mungkin lebih tinggi.');
    }

    await target.kick(`Di-kick oleh ${message.author.tag}`);

    return message.reply(`👢 **${target.user.tag}** telah di-kick dari server.`);
}

async function handleBan(message, target) {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        return message.reply('❌ Kamu tidak punya izin untuk ban member.');
    }

    if (!target.bannable) {
        return message.reply('❌ Aku tidak bisa ban member ini. Role-nya mungkin lebih tinggi.');
    }

    await target.ban({ reason: `Di-ban oleh ${message.author.tag}` });

    return message.reply(`🔨 **${target.user.tag}** telah di-ban dari server.`);
}

async function handlePurge(message, amount) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return message.reply('❌ Kamu tidak punya izin untuk menghapus pesan.');
    }

    // Delete the command message first
    await message.delete().catch(() => { });

    // Bulk delete
    const deleted = await message.channel.bulkDelete(amount, true);

    const reply = await message.channel.send(`🗑️ Berhasil menghapus **${deleted.size}** pesan.`);

    // Auto-delete confirmation after 3 seconds
    setTimeout(() => reply.delete().catch(() => { }), 3000);

    return reply;
}

// --- HELPERS ---

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} hari`;
    if (hours > 0) return `${hours} jam`;
    if (minutes > 0) return `${minutes} menit`;
    return `${seconds} detik`;
}

module.exports = {
    parseAdminCommand,
    executeAdminCommand
};
