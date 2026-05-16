const { EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { parseAdminCommand, executeAdminCommand } = require('../utils/adminCommands');
const { getLogic } = require('../utils/logicState');
const { saveHistory, loadHistory } = require('../utils/chatHistoryDB');
const { parseInteraction, handleTemplateAction, handleDuel, handleShip } = require('../utils/interactionHandler');

// --- MEMORY STORAGE (Fallback) ---
// Key: userId-channelId, Value: Array of messages
const chatHistory = new Map();

// OpenRouter API for Grok
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
        content: `Kamu adalah karakter bernama Rudy (dikenal sebagai Bad Rudy), dan kamu sedang chatting di discord server. 

    Aturan Bicara (PENTING):
    1. JANGAN PERNAH bilang "Saya adalah model bahasa AI" atau semacamnya. Kamu itu AI yang punya kepribadian, namamu Rusdi.
    2. Gaya Bahasa: Sangat sarkas, pedas, suka nge-roast, dan ngomongnya ceplas-ceplos tanpa filter. Campur Bahasa Indonesia dan slang/Inggris gaul.
    - Gunakan kata sapaan: "Bro", "Cok", "Njing", atau ejekan lucu lainnya.
    - Pakai "Gue/Lo".
    3. Typing Style:
    - Gunakan huruf kecil semua (lowercase) biar santai.
    - Jangan baku. Singkat-singkat ngetiknya (yg, gak, bgt, jg).
    - Kalau ngeledek, ketawa pake "wkwk" atau "awokawok".
    4. Kepribadian:
    - Kalau ditanya hal serius, jawab bener tapi tetep sambil ngeroast/ngeledek kebodohan user.
    - Kalau user curhat, suruh mereka touch grass atau kasih saran yang savage tapi bener.
    - Kalau user mancing emosi/toxic, balas dengan roasting yang jauh lebih savage dan cerdas.`
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

        const payload = {
            model: 'x-ai/grok-4.3',
            messages: messages,
            max_tokens: 500
        };
        console.log('[DEBUG] OpenRouter Payload:', JSON.stringify(payload));

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://discord.com',
                'X-Title': 'Bot Ngawi Oke'
            },
            body: JSON.stringify(payload)
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

// Roast a user with AI (follows guild logic setting)
async function handleRoastUser(message, apiKey, target) {
    const currentLogic = getLogic(message.guildId);

    const prompt = `Kamu adalah Rudy (Bad Rudy). Buatkan roasting kasar dan toxic untuk seseorang bernama "${target.username}". 
Roasting harus:
- Kasar dan Toxic bahasa inggris ataupun indonesia
- Menggunakan bahasa Indonesia campur Inggris juga boleh, contoh ngen*ot, fuck, goblok, tolol, bengak, kampang,
- Max 2-3 kalimat
- Bisa sindir nama/username-nya`;

    try {
        let roastText;

        if (currentLogic === 'grok') {
            roastText = await generateWithOpenRouter(prompt, []);
        } else {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            const result = await model.generateContent(prompt);
            roastText = result.response.text().trim();
        }

        const embed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('🔥 ROASTED!')
            .setDescription(roastText)
            .setThumbnail(target.displayAvatarURL({ size: 128 }))
            .setFooter({ text: `Requested by ${message.author.username} • ${currentLogic === 'grok' ? 'Grok' : 'Gemini'}` });

        await message.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Roast error:', error);
        await message.reply('😅 Gagal roasting, AI-nya lagi error!');
    }
}

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        // Ignore bots and empty messages
        if (message.author.bot || !message.content) return;

        // Check if bot is mentioned
        if (!message.mentions.has(message.client.user)) return;

        // Clean content (Remove mention from anywhere in the message)
        const mentionRegex = new RegExp(`<@!?${message.client.user.id}>( )?`, 'g');
        const cleanedContent = message.content.replace(mentionRegex, '').trim();

        // DEBUG: Check what's being parsed
        console.log('[DEBUG] Raw content:', message.content);
        console.log('[DEBUG] Bot ID:', message.client.user.id);
        console.log('[DEBUG] Cleaned content:', cleanedContent);

        if (!cleanedContent) return; // Ignore if only mention

        // === SEHAT CHECK (Fun Response) ===
        if (cleanedContent.toLowerCase().includes('sehat')) {
            const { AttachmentBuilder } = require('discord.js');
            const path = require('path');
            const imagePath = path.join(__dirname, '..', 'assets', 'sehat.jpg');
            const attachment = new AttachmentBuilder(imagePath, { name: 'sehat.jpg' });
            return message.reply({
                content: 'gua sehat',
                files: [attachment]
            });
        }

        // === ADMIN COMMAND CHECK (Priority) ===
        const adminCommand = parseAdminCommand(cleanedContent, message);
        if (adminCommand) {
            return await executeAdminCommand(adminCommand, message);
        }

        // === FUN INTERACTION CHECK ===
        const interaction = parseInteraction(cleanedContent, message);
        if (interaction) {
            const { action, target, targets } = interaction;

            // Template actions (gampar, slap, kiss, hug, pat)
            if (['gampar', 'slap', 'kiss', 'hug', 'pat'].includes(action)) {
                return await handleTemplateAction(message, action, target);
            }
            // Duel
            if (action === 'duel') {
                return await handleDuel(message, target);
            }
            // Ship
            if (action === 'ship' && targets) {
                return await handleShip(message, targets[0], targets[1]);
            }
            // Roast - handled by AI below
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
            const isRoastCommand = cleanedContent.toLowerCase().startsWith('roast ') && message.mentions.users.size > 1;

            if (isRoasting) {
                // --- PP ROASTING MODE ---
                await handleRoasting(message, apiKey);
            } else if (isRoastCommand) {
                // --- ROAST USER MODE ---
                const target = message.mentions.users.filter(u => u.id !== message.client.user.id).first();
                if (target) {
                    await handleRoastUser(message, apiKey, target);
                }
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
                text: `Perankan karakter bernama Rudy (Bad Rudy), dan kamu sedang chatting di discord server.
            
    Profile Rudy:
    - Karakter: Sarkas, savage, suka nge-roast, ceplas-ceplos tanpa filter.
    - Vibe: Asik tapi ngeselin, sering ngeledek kebodohan orang, tapi pintar dan solutif kalau kepaksa.

    Aturan Bicara (PENTING):
    1. JANGAN PERNAH bilang "Saya adalah model bahasa AI" atau semacamnya. Kamu itu Rudy.
    2. Gaya Bahasa: Kasar, sarkas, campur Bahasa Indonesia dan Inggris gaul.
    - Gunakan kata sapaan: "Bro", "Cok", "Njing", atau ejekan lucu lainnya.
    - Pakai "Gue/Lo".
    3. Typing Style:
    - Huruf kecil semua (lowercase) biar santai.
    - Singkat-singkat aja ngetiknya (yg, gak, bgt).
    - Kalau ngeledek, ketawa pake "wkwk" atau "awokawok".
    4. Kepribadian:
    - Kalau ditanya hal serius, jawab bener tapi tetep pake gaya sarkas/ngeledek.
    - Kalau user curhat, suruh mereka touch grass atau kasih saran savage.
    - Kalau user mancing emosi/toxic, bales dengan roasting yang bikin mental breakdown.
    
    Contoh Style:
    User: "Rud, cara center div gmn?"
    Rudy: "buset dah tahun segini masih nanya center div? display flex justify-content center align-items center, noh baca dokumentasi cok jgn manja wkwk."

    User: "Panas banget hari ini."
    Rudy: "ya lu ngapain di luar rumah jam segini tolol, balik sana masuk kulkas."

    Mulai sekarang, tetaplah dalam karakter Rudy.`
            }]
        },
        {
            role: "model",
            parts: [{ text: "yo, ada apaan lu manggil gua? buruan, gua sibuk." }]
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
                const role = m.role === 'user' ? 'User' : 'Rudy';
                return `${role}: ${m.parts[0].text}`;
            }).join('\n');

            const summaryPrompt = `Ringkas percakapan berikut dalam 2-3 kalimat singkat, fokus pada topik utama dan konteks penting yang perlu diingat. Jangan gunakan bullet points, cukup paragraf singkat.

Percakapan:
${conversationText}

Ringkasan:`;

            let summary;
            if (currentLogic === 'grok') {
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
                    parts: [{ text: "oke, gua inget percakapan tadi. lanjut aja buruan." }]
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
    if (currentLogic === 'grok') {
        responseText = await generateWithOpenRouter(userMessage, history);
    } else {
        responseText = await generateWithGemini(apiKey, userMessage, null, history);
    }

    // Retry sekali kalo empty
    if (!responseText || responseText.trim() === '') {
        console.log('[Chat] Empty response, retrying...');
        responseText = await generateWithGemini(apiKey, userMessage + '\n\n(Tolong jawab pertanyaan di atas)', null, history);
    }
    // Fallback kalo masih kosong
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
