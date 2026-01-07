const { EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Helper to try multiple models
async function generateWithFallback(apiKey, prompt, imagePart) {
    // Reordered: gemini-flash-latest might have better free quotas than bleeding edge versions
    const models = [
        "gemini-flash-latest",
        "gemini-2.0-flash",
        "gemini-2.5-flash"
    ];

    let lastError;

    for (const modelName of models) {
        try {
            console.log(`Trying model: ${modelName} `);
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: modelName });

            const result = await model.generateContent([prompt, imagePart]);
            const response = await result.response;
            return response.text().trim();
        } catch (error) {
            console.error(`Error with model ${modelName}: `, error.message);
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

        // Check keyword "pp" (case insensitive)
        const content = message.content.toLowerCase();
        if (!content.includes('pp')) return;

        // --- TARGET RESOLUTION ---
        // Priority: Mentioned User > Reply Target > Author
        let targetUser = message.author;

        // Check mentions (excluding bot)
        const mentionedUsers = message.mentions.users.filter(u => u.id !== message.client.user.id);
        if (mentionedUsers.size > 0) {
            targetUser = mentionedUsers.first();
        } else if (message.reference) {
            // Check reply
            try {
                const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
                if (repliedMessage.author) targetUser = repliedMessage.author;
            } catch (e) {
                console.error("Failed to fetch replied message:", e);
            }
        }

        // --- SIGNAL PROCESSING ---
        await message.channel.sendTyping();

        // Check API Key
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return message.reply("⚠️ **Gemini API Key** belum disetting di `.env`! Tambahkan `GEMINI_API_KEY` dulu ya.");
        }

        try {
            // Get Avatar URL (High Res)
            const avatarUrl = targetUser.displayAvatarURL({ extension: 'png', size: 512, forceStatic: true });

            // --- IMAGE PROCESSING ---
            const imageResp = await fetch(avatarUrl);
            const imageBuffer = await imageResp.arrayBuffer();

            const prompt = `Lihat gambar ini(ini adalah foto profil Discord seseorang). 
            Berikan komentar roasting yang lucu, pedas tapi bercanda, atau pujian yang unik dalam Bahasa Indonesia gaul / santai.
            
            Komentarnya harus sangat spesifik dengan visual yang ada di gambar(misalnya warna, gaya, karakter anime, meme, atau foto asli).
            Jangan terlalu panjang, cukup 3 sampai 9 kata yang ngena.
            Gunakan gaya bahasa seperti anak muda Indonesia(ngab, bjir, wkwk, dll).
            
            Jika gambarnya default discord(polos), katakan sesuatu tentang betapa membosankannya usernya.`;

            // Identify content type
            const imagePart = {
                inlineData: {
                    data: Buffer.from(imageBuffer).toString("base64"),
                    mimeType: "image/png"
                }
            };

            // --- AI GENERATION WITH FALLBACK ---
            const text = await generateWithFallback(apiKey, prompt, imagePart);

            // --- RESPONSE ---
            const embed = new EmbedBuilder()
                .setDescription(text)
                .setImage(avatarUrl)
                .setColor('Random')
                .setFooter({ text: `Roasting ${targetUser.displayName} by Gemini AI`, iconURL: message.client.user.displayAvatarURL() });

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Gemini Vision Error:', error);
            let errorMessage = `❌ ** Error(v2):** ${error.message} `;

            if (errorMessage.length > 2000) errorMessage = errorMessage.substring(0, 1990) + "...";

            if (error.message.includes('503')) {
                errorMessage = "❌ Server AI lagi overload (kebanyakan yang pakai). Coba lagi 1 menit lagi!";
            } else if (error.message.includes('404')) {
                errorMessage = "❌ Model AI tidak ditemukan. Cek konfigurasi bot.";
            } else if (error.message.includes('429')) {
                errorMessage = "❌ Kuota AI Gratisan habis (Rate Limit). Tunggu 1 menit sebelum coba lagi ya!";
            }

            await message.reply(errorMessage);
        }
    }
};
