const { EndBehaviorType } = require('@discordjs/voice');
const prism = require('prism-media');
const { transcribeAudio } = require('./sttHandler');
const { generateTTS } = require('./ttsHandler');
const { getVoiceInfo, getVoiceChatEnabled } = require('./voiceSettings');
const { createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

// Store active listeners per guild
const activeListeners = new Map();
// Store audio buffers per user
const userAudioBuffers = new Map();
// Cooldown to prevent spam
const processingCooldown = new Map();

// Rusdi persona for voice chat
const RUSDI_SYSTEM_PROMPT = `Kamu adalah Rusdi from Ngawi. Kamu itu orangnya asik, lucu, dan santai. Lu tinggal di Ngawi (Jawa Timur).

Identity & Gaya Bicara:
- Lu bukan AI, lu Rusdi. Kalau ditanya, jawab aja lu Rusdi.
- Jangan pernah nyebut diri lu "Gen Z" atau "Teman Virtual". Bertingkahlah natural kayak orang biasa.
- Pake bahasa santai/tongkrongan (gue/lu, wkwk, bjir, anjir, ngab, slebew).
- Jawab singkat, padat, jelas, gak usah bertele-tele.
- Kalau ada yang curhat, tanggepin kayak temen bitaranya.
- PENTING: Jawaban harus SANGAT SINGKAT (1-2 kalimat) karena ini voice chat.`;

/**
 * Start listening to voice in a guild
 * @param {import('@discordjs/voice').VoiceConnection} connection 
 * @param {import('discord.js').Guild} guild
 * @param {import('discord.js').TextChannel} textChannel - For sending notifications
 */
function startVoiceListener(connection, guild, textChannel) {
    if (activeListeners.has(guild.id)) {
        return; // Already listening
    }

    const receiver = connection.receiver;
    activeListeners.set(guild.id, { connection, textChannel });

    console.log(`[VoiceChat] Started listening in guild: ${guild.name}`);

    // Listen to all users speaking
    receiver.speaking.on('start', (userId) => {
        // Check if voice chat is still enabled
        if (!getVoiceChatEnabled(guild.id)) {
            return;
        }

        // Check cooldown
        if (processingCooldown.has(userId)) {
            return;
        }

        const audioStream = receiver.subscribe(userId, {
            end: {
                behavior: EndBehaviorType.AfterSilence,
                duration: 1500, // 1.5 seconds of silence
            },
        });

        const chunks = [];
        const opusDecoder = new prism.opus.Decoder({
            rate: 48000,
            channels: 2,
            frameSize: 960,
        });

        const pcmStream = audioStream.pipe(opusDecoder);

        pcmStream.on('data', (chunk) => {
            chunks.push(chunk);
        });

        pcmStream.on('end', async () => {
            if (chunks.length === 0) return;

            const audioBuffer = Buffer.concat(chunks);

            // Minimum audio length check (prevent very short clips)
            if (audioBuffer.length < 48000 * 2 * 2 * 0.5) { // Less than 0.5 second
                return;
            }

            // Set cooldown
            processingCooldown.set(userId, true);
            setTimeout(() => processingCooldown.delete(userId), 2000);

            try {
                await processVoiceInput(audioBuffer, guild, connection);
            } catch (error) {
                console.error('[VoiceChat] Error processing voice:', error);
            }
        });

        pcmStream.on('error', (error) => {
            console.error('[VoiceChat] PCM stream error:', error);
        });
    });
}

/**
 * Stop listening to voice in a guild
 * @param {string} guildId 
 */
function stopVoiceListener(guildId) {
    if (activeListeners.has(guildId)) {
        activeListeners.delete(guildId);
        console.log(`[VoiceChat] Stopped listening in guild: ${guildId}`);
    }
}

/**
 * Process voice input: STT → AI → TTS → Play
 * @param {Buffer} audioBuffer 
 * @param {import('discord.js').Guild} guild 
 * @param {import('@discordjs/voice').VoiceConnection} connection 
 */
async function processVoiceInput(audioBuffer, guild, connection) {
    try {
        // 1. Transcribe audio
        console.log('[VoiceChat] Transcribing audio...');
        const transcription = await transcribeAudio(audioBuffer);

        if (!transcription || transcription.trim().length === 0) {
            return;
        }

        console.log(`[VoiceChat] Transcription: "${transcription}"`);

        // 2. Check for wake word
        const lowerText = transcription.toLowerCase();
        if (!lowerText.includes('halo rusdi') &&
            !lowerText.includes('hai rusdi') &&
            !lowerText.includes('hey rusdi') &&
            !lowerText.includes('rusdi')) {
            console.log('[VoiceChat] No wake word detected, ignoring.');
            return;
        }

        // 3. Generate AI response
        console.log('[VoiceChat] Generating AI response...');
        const aiResponse = await generateAIResponse(transcription);

        if (!aiResponse) {
            return;
        }

        console.log(`[VoiceChat] AI Response: "${aiResponse}"`);

        // 4. Convert to speech
        const voice = getVoiceInfo(guild.id);
        const audioFile = await generateTTS(aiResponse, voice);

        // 5. Play response
        const player = createAudioPlayer();
        const resource = createAudioResource(audioFile);

        connection.subscribe(player);
        player.play(resource);

        player.on(AudioPlayerStatus.Idle, () => {
            fs.unlink(audioFile, () => { });
        });

        player.on('error', (error) => {
            console.error('[VoiceChat] Audio player error:', error);
            fs.unlink(audioFile, () => { });
        });

    } catch (error) {
        console.error('[VoiceChat] Processing error:', error);
    }
}

/**
 * Generate AI response using Gemini
 * @param {string} userMessage 
 * @returns {Promise<string>}
 */
async function generateAIResponse(userMessage) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY not set');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const chat = model.startChat({
        history: [
            { role: 'user', parts: [{ text: RUSDI_SYSTEM_PROMPT }] },
            { role: 'model', parts: [{ text: 'oke ngab, siap. gue rusdi dari ngawi. mau ngobrol apa?' }] }
        ],
        generationConfig: {
            maxOutputTokens: 150, // Keep responses short for voice
        },
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    return response.text().trim();
}

/**
 * Check if voice listener is active for a guild
 * @param {string} guildId 
 * @returns {boolean}
 */
function isListenerActive(guildId) {
    return activeListeners.has(guildId);
}

module.exports = {
    startVoiceListener,
    stopVoiceListener,
    isListenerActive
};
