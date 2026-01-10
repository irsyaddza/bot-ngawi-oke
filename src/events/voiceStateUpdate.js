const { getVoiceConnection, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const fs = require('fs');
const { generateTTS } = require('../utils/ttsHandler');
const { getBotWelcome, getVoiceInfo, VOICES } = require('../utils/voiceSettings');
const { isAllowed, getLockInfo } = require('../utils/voiceLock');
const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const { sendAuditLog } = require('../utils/auditLogUtils');

// TTS generation logic moved to shared handler

// Voice Lock Handler - disconnect unauthorized users from locked channels
async function handleVoiceLock(oldState, newState) {
    // Only handle joins (user moves to a new channel)
    if (!newState.channelId) return false; // User left VC
    if (oldState.channelId === newState.channelId) return false; // Same channel

    const member = newState.member;
    const guildId = newState.guild.id;
    const channelId = newState.channelId;

    // Check if the channel is locked
    const lockInfo = getLockInfo(guildId, channelId);
    if (!lockInfo) return false; // Not locked

    // Check if member is allowed
    if (isAllowed(guildId, channelId, member)) {
        return false; // Allowed to join
    }

    // Not allowed - disconnect
    try {
        await member.voice.disconnect('Voice channel is locked');
        console.log(`[VoiceLock] Disconnected ${member.user.tag} from locked channel ${channelId}`);

        // Optional: Send DM to user
        try {
            await member.send({
                content: `🔒 Kamu di-disconnect dari **${newState.channel.name}** karena channel sedang di-lock.`
            });
        } catch (e) {
            // DM might be disabled
        }
        return true; // Handled
    } catch (error) {
        console.error(`[VoiceLock] Failed to disconnect ${member.user.tag}:`, error);
        return false;
    }
}

// Audit Log Handler for Voice - KICK, MOVE, MUTE/DEAFEN only (no join/leave)
async function handleVoiceAudit(oldState, newState) {
    if (!oldState.guild) return;

    const member = newState.member || oldState.member;
    const guild = oldState.guild;

    let eventType = '';
    let description = '';
    let color = '#FFAA00';
    let fields = [];

    // 1. Kick (Leave but forced by moderator)
    if (oldState.channelId && !newState.channelId) {
        try {
            const fetchedLogs = await guild.fetchAuditLogs({
                limit: 1,
                type: AuditLogEvent.MemberDisconnect,
            });
            const kickLog = fetchedLogs.entries.first();

            if (kickLog && kickLog.target?.id === member.id && kickLog.createdTimestamp > (Date.now() - 5000)) {
                eventType = '👢 Member Disconnected (Kick)';
                color = '#FF4500';
                description = `Kicked from **<#${oldState.channelId}>**`;
                fields.push({ name: '👮 Kicked by', value: `${kickLog.executor?.tag || 'Unknown'}`, inline: true });
            }
        } catch (e) { }
    }
    // 2. Move
    else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
        eventType = '🔀 Member Moved Voice';
        color = '#00AAFF';
        description = `Moved from **<#${oldState.channelId}>** to **<#${newState.channelId}>**`;
    }
    // 3. Server Mute/Deafen
    else if (oldState.serverMute !== newState.serverMute) {
        eventType = newState.serverMute ? '� Server Muted' : '🔊 Server Unmuted';
        color = newState.serverMute ? '#FF0000' : '#00FF00';
        description = `In **<#${newState.channelId}>**`;

        try {
            const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberUpdate });
            const log = fetchedLogs.entries.first();
            if (log && log.target?.id === member.id && log.createdTimestamp > (Date.now() - 5000)) {
                fields.push({ name: '👮 By', value: `${log.executor?.tag || 'Unknown'}`, inline: true });
            }
        } catch (e) { }
    }
    else if (oldState.serverDeaf !== newState.serverDeaf) {
        eventType = newState.serverDeaf ? '🙉 Server Deafened' : '👂 Server Undeafened';
        color = newState.serverDeaf ? '#FF0000' : '#00FF00';
        description = `In **<#${newState.channelId}>**`;

        try {
            const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberUpdate });
            const log = fetchedLogs.entries.first();
            if (log && log.target?.id === member.id && log.createdTimestamp > (Date.now() - 5000)) {
                fields.push({ name: '👮 By', value: `${log.executor?.tag || 'Unknown'}`, inline: true });
            }
        } catch (e) { }
    }

    // Only send if we have an event
    if (!eventType) return;

    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(eventType)
        .setDescription(description)
        .setAuthor({
            name: member.user.tag,
            iconURL: member.user.displayAvatarURL({ size: 32 })
        })
        .setTimestamp();

    if (fields.length > 0) {
        embed.addFields(fields);
    }

    await sendAuditLog(guild.id, guild.client, embed);
}

// Function to play TTS in voice channel
async function playWelcomeTTS(guildId, memberName, isBot = false) {
    const connection = getVoiceConnection(guildId);
    if (!connection) return;

    try {
        let message;
        let voice;

        if (isBot) {
            message = "Rusdi from ngawi is here!";
            voice = getVoiceInfo(guildId); // Use current guild voice setting
        } else {
            const welcomeMessages = [
                `Halo ${memberName}, selamat datang!`,
                `Wah, ${memberName} sudah datang!`,
                `Hai ${memberName}!`,
                `Selamat datang ${memberName}!`,
                `Akhirnya ${memberName} join juga!`
            ];
            message = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
            // Use current guild voice for user welcome
            voice = getVoiceInfo(guildId);
        }

        const filePath = await generateTTS(message, voice);

        const player = createAudioPlayer();
        const resource = createAudioResource(filePath);

        connection.subscribe(player);
        player.play(resource);

        player.on(AudioPlayerStatus.Idle, () => {
            fs.unlink(filePath, () => { });
        });

        player.on('error', error => {
            console.error('Welcome TTS Error:', error);
            fs.unlink(filePath, () => { });
        });

    } catch (error) {
        console.error('Failed to play welcome TTS:', error);
    }
}

module.exports = {
    name: 'voiceStateUpdate',
    async execute(oldState, newState) {
        // 1. Audit Log (Voice) - KICK ONLY
        if (oldState.guild) {
            await handleVoiceAudit(oldState, newState);
        }

        // 2. Voice Lock
        const wasLocked = await handleVoiceLock(oldState, newState);
        if (wasLocked) return; // User was disconnected, no need to continue

        // 3. Welcome TTS
        const joinedChannel = !oldState.channelId && newState.channelId;

        // Check if user moved to a different channel
        const movedChannel = oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId;

        if (joinedChannel || movedChannel) {
            // Get the bot's voice connection in this guild
            const connection = getVoiceConnection(newState.guild.id);
            const client = newState.client;

            // Only greet if bot is in the same channel
            if (connection && connection.joinConfig.channelId === newState.channelId) {

                // Logic for Bot Join Welcome
                if (newState.member.id === client.user.id) {
                    const isBotWelcomeEnabled = getBotWelcome(newState.guild.id);
                    if (isBotWelcomeEnabled) {
                        setTimeout(() => {
                            playWelcomeTTS(newState.guild.id, 'Bot', true);
                        }, 1000);
                    }
                    return;
                }

                // Logic for User Join Welcome (Ignore bots)
                if (newState.member.user.bot) return;

                // Get display name
                const memberName = newState.member.displayName || newState.member.user.username;

                // Small delay to let them fully connect
                setTimeout(() => {
                    playWelcomeTTS(newState.guild.id, memberName, false);
                }, 1000);
            }
        }
    }
};
