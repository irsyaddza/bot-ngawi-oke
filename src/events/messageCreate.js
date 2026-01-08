const { EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { parseAdminCommand, executeAdminCommand } = require('../utils/adminCommands');

// --- MEMORY STORAGE ---
// Key: userId-channelId, Value: Array of { role: "user" | "model", parts: [{ text: string }] }
const chatHistory = new Map();

// Helper to try multiple models
async function generateWithFallback(apiKey, prompt, imagePart = null, history = []) {
    // Reordered: gemini-flash-latest might have better free quotas than bleeding edge versions
    const models = [
        "gemini-flash-latest",
        "gemini-2.0-flash",
        "gemini-2.5-flash"
    ];

    let lastError;

    for (const modelName of models) {
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: modelName });

            let result;
            if (imagePart) {
                // Vision Mode (No History for now)
                result = await model.generateContent([prompt, imagePart]);
            } else {
                // Chat Mode (With History)
                const chat = model.startChat({
                    history: history,
                    generationConfig: {
                        maxOutputTokens: 500,
                    },
                });
                result = await chat.sendMessage(prompt);
            }

            const response = await result.response;
            return response.text().trim();
        } catch (error) {
            console.error(`Error with model ${modelName}:`, error.message);
            lastError = error;

            // Continue if 404 (Not Found), 503 (Overloaded), or 429 (Rate Limit)
            if (error.message.includes('404') || error.message.includes('503') || error.message.includes('429')) {
                continue;
            }
            throw error;
        }
    }
    throw lastError;
}

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        // Ignore bots and empty messages
        if (message.author.bot || !message.content) return;

        // Check if bot is mentioned
        if (!message.mentions.has(message.client.user)) return;

        // Clean content (Remove mention)
        const mentionRegex = new RegExp(`^<@!?${message.client.user.id}>( )?`);
        const cleanedContent = message.content.replace(mentionRegex, '').trim();

        if (!cleanedContent) return; // Ignore if only mention

        // === ADMIN COMMAND CHECK (Priority) ===
        const adminCommand = parseAdminCommand(cleanedContent, message);
        if (adminCommand) {
            return await executeAdminCommand(adminCommand, message);
        }

        // === AI CHAT MODE ===
        // Check API Key
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return message.reply("⚠️ **Gemini API Key** belum disetting di `.env`! Tambahkan `GEMINI_API_KEY` dulu ya.");
        }

        await message.channel.sendTyping();

        try {
            // === FEATURE SWITCHER ===
            const isRoasting = cleanedContent.toLowerCase().includes('pp');

            if (isRoasting) {
                // --- PP ROASTING MODE ---
                await handleRoasting(message, apiKey);
            } else {
                // --- CHAT AI MODE ---
                await handleChat(message, apiKey, cleanedContent);
            }


        } catch (error) {
            console.error('Gemini Error:', error);
            let errorMessage = `❌ **Error (v3):** ${error.message}`;
            if (errorMessage.length > 2000) errorMessage = errorMessage.substring(0, 1990) + "...";

            if (error.message.includes('503')) {
                errorMessage = "❌ Server AI lagi overload. Coba lagi 1 menit lagi!";
            } else if (error.message.includes('429')) {
                errorMessage = "❌ Kuota AI Gratisan habis. Tunggu sebentar ya!";
            }

            await message.reply(errorMessage);
        }
    }
};

// --- LOGIC: CHAT ---
async function handleChat(message, apiKey, userMessage) {
    const userId = message.author.id;
    const historyKey = `${userId}-${message.channel.id}`;

    // Initialize or Retrieve History
    let history = chatHistory.get(historyKey) || [
        {
            role: "user",
            parts: [{
                text: `Kamu adalah Rusdi from Ngawi. Kamu itu orangnya asik, lucu, dan santai. Lu tinggal di Ngawi (Jawa Timur).
            
Identity & Gaya Bicara:
- Lu bukan AI, lu Rusdi. Kalau ditanya, jawab aja lu Rusdi.
- Jangan pernah nyebut diri lu "Gen Z" atau "Teman Virtual". Bertingkahlah natural kayak orang biasa.
- Pake bahasa santai/tongkrongan (gue/lu, wkwk, bjir, anjir, ngab, slebew).
- Typing lowercase (huruf kecil) biar gak kaku.
- Jawab singkat, padat, jelas, gak usah bertele-tele kayak wikipedia.
- Kalau ada yang curhat, tanggepin kayak temen, kadang sarkas dikit lucu juga.
` }]
        },
        {
            role: "model",
            parts: [{ text: "oke ngab aman. gue rusdi, asli ngawi. mau bahas apaan nih?" }]
        }
    ];

    // Generate Response
    const responseText = await generateWithFallback(apiKey, userMessage, null, history);

    // Update History
    // Gemini History Format: { role: 'user'|'model', parts: [{ text: '...' }] }
    history.push({ role: "user", parts: [{ text: userMessage }] });
    history.push({ role: "model", parts: [{ text: responseText }] });

    // Limit History (Last 12 turns = 6 interactions) to save tokens
    if (history.length > 12) {
        history = [history[0], history[1], ...history.slice(history.length - 10)];
    }
    chatHistory.set(historyKey, history);

    // Reply
    await message.reply(responseText);
}

// --- LOGIC: PP ROASTING ---
async function handleRoasting(message, apiKey) {
    // Priority: Mentioned User > Reply Target > Author
    let targetUser = message.author;
    const mentionedUsers = message.mentions.users.filter(u => u.id !== message.client.user.id);
    if (mentionedUsers.size > 0) {
        targetUser = mentionedUsers.first();
    } else if (message.reference) {
        try {
            const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
            if (repliedMessage.author) targetUser = repliedMessage.author;
        } catch (e) {
            console.error("Failed to fetch replied message:", e);
        }
    }

    const avatarUrl = targetUser.displayAvatarURL({ extension: 'png', size: 512, forceStatic: true });
    const imageResp = await fetch(avatarUrl);
    const imageBuffer = await imageResp.arrayBuffer();

    const prompt = `Lihat gambar ini (ini adalah foto profil Discord seseorang).
    Berikan komentar roasting yang lucu, pedas tapi bercanda, atau pujian yang unik dalam Bahasa Indonesia gaul/santai.
    Komentarnya harus sangat spesifik dengan visual yang ada di gambar.
    Jangan terlalu panjang, cukup 3 sampai 9 kata yang ngena.
    Gunakan gaya bahasa seperti anak muda Indonesia (wok, bjir, wkwk, dll).
    Jika gambarnya default discord (polos), katakan sesuatu tentang betapa membosankannya usernya.`;

    const imagePart = {
        inlineData: {
            data: Buffer.from(imageBuffer).toString("base64"),
            mimeType: "image/png"
        }
    };

    const text = await generateWithFallback(apiKey, prompt, imagePart);

    const embed = new EmbedBuilder()
        .setDescription(text)
        .setImage(avatarUrl)
        .setColor('Random')
        .setFooter({ text: `Roasting ${targetUser.displayName} by Gemini AI`, iconURL: message.client.user.displayAvatarURL() });

    await message.reply({ embeds: [embed] });
}
