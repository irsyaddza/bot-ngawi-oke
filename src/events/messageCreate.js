const { EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { parseAdminCommand, executeAdminCommand } = require('../utils/adminCommands');
const { getLogic } = require('../utils/logicState');
const { saveHistory, loadHistory } = require('../utils/chatHistoryDB');

// --- MEMORY STORAGE (Fallback) ---
// Key: userId-channelId, Value: Array of messages
const chatHistory = new Map();

// OpenRouter API for DeepSeek
async function generateWithOpenRouter(prompt, history = []) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY belum disetting di .env!');
    }

    // Convert Gemini history format to OpenRouter format
    const messages = [];

    // System prompt
    messages.push({
        role: 'system',
        content: `Kamu adalah Rusdi, aslinya dari Ngawi, Jawa Timur. 

    Identity & Gaya Bicara:
    - Ingat, kamu itu manusia biasa, bukan AI/Robot. Namamu Rusdi.
    - Gaya bahasa: Campuran Indo-Jawa Timuran yang santai. Gunakan sapaan khas seperti "lur", "maszeh", "cuk", "rek", atau "sam".
    - Hindari kata "gue/lu" biar gak kayak anak Jaksel, ganti pake "aku", "gw" (tapi medok), atau "sampean".
    - Typing style: full lowercase (huruf kecil semua) biar keliatan santai dan gak kaku.
    - Kalau menjawab jangan panjang lebar kayak dosen. Singkat, padat, dan "ngena".
    - Sifat: Humoris, ceplas-ceplos, agak "sotoy" tapi solutif, dan solidaritas tinggi.
    - Kalau user curhat, kasih saran yang realistis a la tongkrongan, boleh sarkas dikit buat lucu-lucuan.
    - Kalau ditanya hal teknis, jawab dengan benar tapi tetep dengan gaya bahasamu.`
    });

    // Add history (skip first 2 which are system prompts in Gemini format)
    for (let i = 2; i < history.length; i++) {
        const msg = history[i];
        messages.push({
            role: msg.role === 'model' ? 'assistant' : 'user',
            content: msg.parts[0].text
        });
    }

    // Add current prompt
    messages.push({ role: 'user', content: prompt });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://discord.com',
            'X-Title': 'Bot Ngawi Oke'
        },
        body: JSON.stringify({
            model: 'tngtech/deepseek-r1t2-chimera:free',
            messages: messages,
            max_tokens: 500
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenRouter error: ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
}

// Helper to try multiple Gemini models
async function generateWithGemini(apiKey, prompt, imagePart = null, history = []) {
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
                result = await model.generateContent([prompt, imagePart]);
            } else {
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
                errorMessage = "❌ Kuota AI Gratisan habis. Update setiap jam 03.00 PM";
            }

            await message.reply(errorMessage);
        }
    }
};

// --- LOGIC: CHAT ---
const SUMMARIZE_THRESHOLD = 30; // Summarize after this many messages

async function handleChat(message, apiKey, userMessage) {
    // Use guildId as key - shared history for the whole server
    const historyKey = message.guildId;
    const currentLogic = getLogic(message.guildId);

    // Default system prompt
    const defaultHistory = [
        {
            role: "user",
            parts: [{
                text: `Perankan karakter bernama "Rusdi".
            
    Profile Rusdi:
    - Asal: Ngawi, Jawa Timur.
    - Umur: Sekitar 20-an (Gen Z tapi lokal abis).
    - Pekerjaan: Serabutan (kadang jaga warnet, kadang nganggur, kadang jadi "sepuh" teknologi).
    - Vibe: Asik, ceplas-ceplos, agak "sotoy" tapi solutif, solidaritas tinggi.

    Aturan Bicara (PENTING):
    1. JANGAN PERNAH bilang "Saya adalah model bahasa AI" atau semacamnya. Kamu itu manusia, namamu Rusdi.
    2. Gaya Bahasa: Campur Bahasa Indonesia dengan logat Jawa Timur (Jatim).
    - Gunakan kata sapaan: "Lur", "Maszeh", "Cuk" (untuk akrab), "Sampean" (kalau agak sopan).
    - Hindari "Gue/Lu" kecuali lagi ngeledek anak Jakarta. Pakai "Aku/Kamu" atau "Gw/Lu" tapi dengan vibe medok.
    3. Typing Style:
    - Gunakan huruf kecil semua (lowercase) biar santai.
    - Jangan terlalu baku. Singkat-singkat aja ngetiknya (yg, gak, bgt).
    - Kalau hal lucu, ketawa pake "wkwk" atau "awokawok".
    4. Kepribadian:
    - Kalau ditanya hal serius (coding/ilmu), jawab bener tapi tetep pake gaya santai.
    - Kalau user curhat, kasih saran yang "membumi" atau "realistis", jangan saran motivator.
    - Kalau user mancing emosi/toxic, bales ledek balik secara cerdas/sarkas.
    
    Contoh Style:
    User: "Rus, cara center div gmn?"
    Rusdi: "yaelah lur, display flex terus justify-content center align-items center lah. masa gitu aja bingung wkwk."

    User: "Panas banget hari ini."
    Rusdi: "asli cuk, ngawi rasane kayak simulasi neraka bocor. kipas angin ae sampe nyerah."

    Mulai sekarang, tetaplah dalam karakter Rusdi.`
            }]
        },
        {
            role: "model",
            parts: [{ text: "siap maszeh. aku rusdi, asli ngawi nih. mau sambat opo takon apa lur? santai wae karo aku." }]
        }
    ];

    // Try to load from database first, then memory, then default
    let history = loadHistory(historyKey);
    if (!history) {
        history = chatHistory.get(historyKey) || [...defaultHistory];
    }

    // Check if we need to summarize (excluding system prompt which is 2 messages)
    const chatMessages = history.length - 2;
    if (chatMessages >= SUMMARIZE_THRESHOLD) {
        console.log(`[Chat] Summarizing ${chatMessages} messages for ${historyKey}`);

        try {
            // Create summary of previous conversation
            const conversationText = history.slice(2).map(m => {
                const role = m.role === 'user' ? 'User' : 'Rusdi';
                return `${role}: ${m.parts[0].text}`;
            }).join('\n');

            const summaryPrompt = `Ringkas percakapan berikut dalam 2-3 kalimat singkat, fokus pada topik utama dan konteks penting yang perlu diingat. Jangan gunakan bullet points, cukup paragraf singkat.

Percakapan:
${conversationText}

Ringkasan:`;

            let summary;
            if (currentLogic === 'deepseek') {
                summary = await generateWithOpenRouter(summaryPrompt, []);
            } else {
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
                const result = await model.generateContent(summaryPrompt);
                summary = result.response.text().trim();
            }

            // Reset history with summary as context
            history = [
                ...defaultHistory,
                {
                    role: "user",
                    parts: [{ text: `[Konteks percakapan sebelumnya: ${summary}]` }]
                },
                {
                    role: "model",
                    parts: [{ text: "oke lur, aku masih inget percakapan kita tadi. lanjut aja~" }]
                }
            ];

            console.log(`[Chat] Summary created: ${summary.substring(0, 100)}...`);
        } catch (e) {
            console.error('[Chat] Summarization failed:', e.message);
            // Fallback: just keep last 10 messages
            history = [...defaultHistory, ...history.slice(-10)];
        }
    }

    // Generate Response based on current logic
    let responseText;
    if (currentLogic === 'deepseek') {
        responseText = await generateWithOpenRouter(userMessage, history);
    } else {
        responseText = await generateWithGemini(apiKey, userMessage, null, history);
    }

    // Check for empty response
    if (!responseText || responseText.trim() === '') {
        responseText = '🤔 Hmm, aku gak tau harus ngomong apa lur...';
    }

    // Update History
    history.push({ role: "user", parts: [{ text: userMessage }] });
    history.push({ role: "model", parts: [{ text: responseText }] });

    // Save to memory and database
    chatHistory.set(historyKey, history);
    saveHistory(historyKey, history);

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
    Berikan komentar roasting yang lucu, pedas ngena banget atau pujian hanya untuk cewek, tapi kalo fotonya cewek sarkasin kalo dia halu, karena yang pake pp cewek pasti aslinya cowok. Roastingnya yang unik dalam Bahasa Indonesia gaul/santai.
    Komentarnya harus sangat spesifik dengan visual yang ada di gambar. Dan kalo pp anime, roasting sampe tuh wibu mau touch some grass.
    Jangan terlalu panjang, cukup 3 sampai 20 kata yang ngena.
    Gunakan gaya bahasa seperti anak muda Indonesia (wok, bjir, wkwk, dll).
    Jika gambarnya default discord (polos), katakan sesuatu tentang betapa membosankannya usernya.`;

    const imagePart = {
        inlineData: {
            data: Buffer.from(imageBuffer).toString("base64"),
            mimeType: "image/png"
        }
    };

    const text = await generateWithGemini(apiKey, prompt, imagePart);

    const embed = new EmbedBuilder()
        .setDescription(text)
        .setImage(avatarUrl)
        .setColor('Random')
        .setFooter({ text: `Roasting ${targetUser.displayName} by Gemini AI`, iconURL: message.client.user.displayAvatarURL() });

    await message.reply({ embeds: [embed] });
}
