const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dashboard')
        .setDescription('Lihat info dan usage API')
        .addStringOption(option =>
            option.setName('provider')
                .setDescription('Pilih provider API')
                .setRequired(true)
                .addChoices(
                    { name: '🤖 Gemini AI', value: 'gemini' },
                    { name: '🎙️ ElevenLabs', value: 'elevenlabs' }
                )
        ),

    async execute(interaction) {
        const provider = interaction.options.getString('provider');

        await interaction.deferReply({ ephemeral: true });

        try {
            if (provider === 'gemini') {
                await showGeminiDashboard(interaction);
            } else if (provider === 'elevenlabs') {
                await showElevenLabsDashboard(interaction);
            }
        } catch (error) {
            console.error('Dashboard error:', error);
            await interaction.editReply({
                content: `❌ Error fetching dashboard: ${error.message}`
            });
        }
    }
};

async function showGeminiDashboard(interaction) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return interaction.editReply({
            content: '❌ `GEMINI_API_KEY` tidak ditemukan di `.env`!'
        });
    }

    // Test API availability by making a simple request
    let isAvailable = false;
    let availabilityStatus = '❌ Unavailable';
    let errorReason = '';

    try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // Simple test request
        const result = await model.generateContent('Hi');
        const response = await result.response;

        if (response.text()) {
            isAvailable = true;
            availabilityStatus = '✅ Available';
        }
    } catch (error) {
        isAvailable = false;
        if (error.message.includes('429')) {
            availabilityStatus = '⚠️ Rate Limited';
            errorReason = 'Kuota habis, update setiap jam 15.00 PM.';
        } else if (error.message.includes('403')) {
            availabilityStatus = '🚫 Forbidden';
            errorReason = 'API key tidak valid atau diblokir.';
        } else if (error.message.includes('503')) {
            availabilityStatus = '🔧 Overloaded';
            errorReason = 'Server sedang sibuk.';
        } else {
            availabilityStatus = '❌ Error';
            errorReason = error.message.substring(0, 50);
        }
    }

    const embed = new EmbedBuilder()
        .setTitle('🤖 Gemini AI Dashboard')
        .setColor(isAvailable ? '#4285F4' : '#FF5555')
        .setThumbnail('https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg')
        .addFields(
            { name: '🟢 AI Available?', value: availabilityStatus, inline: true },
            { name: '📊 API Key', value: '✅ Configured', inline: true },
            { name: '\u200B', value: '\u200B', inline: true },
            { name: '🔧 Models', value: '`gemini-2.0-flash`\n`gemini-flash-latest`\n`gemini-2.5-flash`', inline: true },
            { name: '💰 Tier', value: 'Free', inline: true },
            { name: '📈 Rate Limits', value: '15 RPM\n1M TPM\n1500 RPD', inline: true },
            {
                name: '📝 Notes', value:
                    '• RPM = Requests Per Minute\n' +
                    '• TPM = Tokens Per Minute\n' +
                    '• RPD = Requests Per Day'
            }
        )
        .setFooter({ text: 'Powered by Google AI' })
        .setTimestamp();

    // Add error reason if not available
    if (!isAvailable && errorReason) {
        embed.addFields({
            name: '⚠️ Reason',
            value: errorReason
        });
    }

    await interaction.editReply({ embeds: [embed] });
}

async function showElevenLabsDashboard(interaction) {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
        return interaction.editReply({
            content: '❌ `ELEVENLABS_API_KEY` tidak ditemukan di `.env`!'
        });
    }

    // Fetch user subscription info
    const response = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
        method: 'GET',
        headers: {
            'xi-api-key': apiKey
        }
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`ElevenLabs API Error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();

    // Calculate usage percentage
    const usagePercent = ((data.character_count / data.character_limit) * 100).toFixed(1);
    const remaining = data.character_limit - data.character_count;

    // Create progress bar
    const progressBar = createProgressBar(usagePercent);

    // Format reset date
    const resetDate = data.next_character_count_reset_unix
        ? `<t:${data.next_character_count_reset_unix}:R>`
        : 'N/A';

    // Tier emoji
    const tierEmoji = {
        'free': '🆓',
        'starter': '⭐',
        'creator': '🎨',
        'pro': '💎',
        'scale': '🚀',
        'enterprise': '🏢'
    };

    const embed = new EmbedBuilder()
        .setTitle('🎙️ ElevenLabs Dashboard')
        .setColor('#00D4AA')
        .setThumbnail('https://elevenlabs.io/favicon.ico')
        .addFields(
            { name: '📊 Status', value: '✅ API Key Valid', inline: true },
            { name: '💳 Tier', value: `${tierEmoji[data.tier] || '📦'} ${capitalizeFirst(data.tier)}`, inline: true },
            { name: '\u200B', value: '\u200B', inline: true },
            {
                name: '📈 Character Usage', value:
                    `${progressBar}\n` +
                    `**${data.character_count.toLocaleString()}** / **${data.character_limit.toLocaleString()}** (${usagePercent}%)\n` +
                    `Remaining: **${remaining.toLocaleString()}** characters`
            },
            { name: '🔄 Reset', value: resetDate, inline: true },
            { name: '🎤 Voice Slots', value: `${data.voice_limit || 'N/A'}`, inline: true },
            { name: '\u200B', value: '\u200B', inline: true }
        )
        .setFooter({ text: 'Data dari ElevenLabs API' })
        .setTimestamp();

    // Add warning if usage is high
    if (usagePercent > 80) {
        embed.addFields({
            name: '⚠️ Warning',
            value: `Usage sudah **${usagePercent}%**! Pertimbangkan untuk upgrade atau hemat penggunaan.`
        });
    }

    await interaction.editReply({ embeds: [embed] });
}

// Helper: Create progress bar
function createProgressBar(percent) {
    const filled = Math.round(percent / 10);
    const empty = 10 - filled;
    const filledChar = '█';
    const emptyChar = '░';

    return `\`${filledChar.repeat(filled)}${emptyChar.repeat(empty)}\``;
}

// Helper: Capitalize first letter
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
