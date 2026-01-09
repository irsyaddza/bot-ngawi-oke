const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { lockChannel, unlockChannel, getLockInfo, getLockedChannels, addToWhitelist, removeFromWhitelist } = require('../utils/voiceLock');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('voicelock')
        .setDescription('🔒 Lock/Unlock voice channel')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Voice channel yang mau di-lock/unlock')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildVoice)
        )
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Lock atau Unlock')
                .setRequired(true)
                .addChoices(
                    { name: '🔒 Lock', value: 'lock' },
                    { name: '🔓 Unlock', value: 'unlock' },
                    { name: '➕ Add to Whitelist', value: 'add' },
                    { name: '➖ Remove from Whitelist', value: 'remove' },
                    { name: '📋 Status', value: 'status' }
                )
        )
        .addStringOption(option =>
            option.setName('allowed')
                .setDescription('User/Role yang boleh join (mention, pisah spasi). Contoh: @user1 @role1')
                .setRequired(false)
        ),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const action = interaction.options.getString('action');
        const allowedMentions = interaction.options.getString('allowed') || '';

        // Parse allowed users and roles from mentions
        const allowedUsers = [];
        const allowedRoles = [];

        // Extract user IDs from mentions
        const userMatches = allowedMentions.match(/<@!?(\d+)>/g) || [];
        for (const match of userMatches) {
            const id = match.replace(/<@!?/, '').replace('>', '');
            allowedUsers.push(id);
        }

        // Extract role IDs from mentions
        const roleMatches = allowedMentions.match(/<@&(\d+)>/g) || [];
        for (const match of roleMatches) {
            const id = match.replace('<@&', '').replace('>', '');
            allowedRoles.push(id);
        }

        if (action === 'lock') {
            // Lock the channel (without kicking existing members)
            lockChannel(interaction.guildId, channel.id, allowedUsers, allowedRoles);

            // Build allowed list for display
            let allowedDisplay = 'Tidak ada (semua yang join baru di-block)';
            if (allowedUsers.length > 0 || allowedRoles.length > 0) {
                const parts = [];
                if (allowedUsers.length > 0) {
                    parts.push(allowedUsers.map(id => `<@${id}>`).join(', '));
                }
                if (allowedRoles.length > 0) {
                    parts.push(allowedRoles.map(id => `<@&${id}>`).join(', '));
                }
                allowedDisplay = parts.join(', ');
            }

            const currentMembers = channel.members.size;

            const embed = new EmbedBuilder()
                .setColor('#FF5555')
                .setTitle('🔒 Voice Channel Locked')
                .setDescription('Member yang sudah ada tetap bisa stay.\nOrang baru yang mencoba join akan di-disconnect otomatis.')
                .addFields(
                    { name: '🔊 Channel', value: `<#${channel.id}>`, inline: true },
                    { name: '👥 Current Members', value: `${currentMembers}`, inline: true },
                    { name: '✅ Allowed to Join', value: allowedDisplay, inline: false }
                )
                .setFooter({ text: `Locked by ${interaction.user.username}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } else if (action === 'unlock') {
            const wasLocked = unlockChannel(interaction.guildId, channel.id);

            if (!wasLocked) {
                return interaction.reply({
                    content: `❌ <#${channel.id}> tidak sedang di-lock!`,
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setColor('#00FF88')
                .setTitle('🔓 Voice Channel Unlocked')
                .setDescription(`<#${channel.id}> sekarang bisa diakses semua orang.`)
                .setFooter({ text: `Unlocked by ${interaction.user.username}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } else if (action === 'status') {
            const lockInfo = getLockInfo(interaction.guildId, channel.id);

            if (!lockInfo) {
                return interaction.reply({
                    content: `🔓 <#${channel.id}> **tidak di-lock**.`,
                    ephemeral: true
                });
            }

            // Build allowed list
            let allowedDisplay = 'Tidak ada (semua di-kick)';
            if (lockInfo.allowedUsers.length > 0 || lockInfo.allowedRoles.length > 0) {
                const parts = [];
                if (lockInfo.allowedUsers.length > 0) {
                    parts.push(lockInfo.allowedUsers.map(id => `<@${id}>`).join(', '));
                }
                if (lockInfo.allowedRoles.length > 0) {
                    parts.push(lockInfo.allowedRoles.map(id => `<@&${id}>`).join(', '));
                }
                allowedDisplay = parts.join(', ');
            }

            const embed = new EmbedBuilder()
                .setColor('#FFAA00')
                .setTitle('🔒 Voice Lock Status')
                .addFields(
                    { name: '🔊 Channel', value: `<#${channel.id}>`, inline: true },
                    { name: '⏰ Locked Since', value: `<t:${Math.floor(lockInfo.lockedAt / 1000)}:R>`, inline: true },
                    { name: '✅ Allowed', value: allowedDisplay, inline: false }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });

        } else if (action === 'add') {
            // Add to whitelist
            if (allowedUsers.length === 0 && allowedRoles.length === 0) {
                return interaction.reply({
                    content: '❌ Harus mention user/role yang mau ditambahkan!',
                    ephemeral: true
                });
            }

            const success = addToWhitelist(interaction.guildId, channel.id, allowedUsers, allowedRoles);

            if (!success) {
                return interaction.reply({
                    content: `❌ <#${channel.id}> tidak sedang di-lock!`,
                    ephemeral: true
                });
            }

            const addedList = [
                ...allowedUsers.map(id => `<@${id}>`),
                ...allowedRoles.map(id => `<@&${id}>`)
            ].join(', ');

            const embed = new EmbedBuilder()
                .setColor('#00AAFF')
                .setTitle('➕ Added to Whitelist')
                .addFields(
                    { name: '🔊 Channel', value: `<#${channel.id}>`, inline: true },
                    { name: '✅ Added', value: addedList, inline: true }
                )
                .setFooter({ text: `By ${interaction.user.username}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } else if (action === 'remove') {
            // Remove from whitelist
            if (allowedUsers.length === 0 && allowedRoles.length === 0) {
                return interaction.reply({
                    content: '❌ Harus mention user/role yang mau dihapus!',
                    ephemeral: true
                });
            }

            const success = removeFromWhitelist(interaction.guildId, channel.id, allowedUsers, allowedRoles);

            if (!success) {
                return interaction.reply({
                    content: `❌ <#${channel.id}> tidak sedang di-lock!`,
                    ephemeral: true
                });
            }

            const removedList = [
                ...allowedUsers.map(id => `<@${id}>`),
                ...allowedRoles.map(id => `<@&${id}>`)
            ].join(', ');

            const embed = new EmbedBuilder()
                .setColor('#FF6600')
                .setTitle('➖ Removed from Whitelist')
                .addFields(
                    { name: '🔊 Channel', value: `<#${channel.id}>`, inline: true },
                    { name: '❌ Removed', value: removedList, inline: true }
                )
                .setFooter({ text: `By ${interaction.user.username}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    }
};
