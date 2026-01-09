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
                    { name: '🟢 Deepseek (OpenRouter)', value: 'openrouter' },
                    { name: '🎙️ ElevenLabs', value: 'elevenlabs' }
                )
        ),

    async execute(interaction) {
        const provider = interaction.options.getString('provider');

        await interaction.deferReply({ ephemeral: true });

        try {
            if (provider === 'gemini') {
                await showGeminiDashboard(interaction);
            } else if (provider === 'openrouter') {
                await showOpenRouterDashboard(interaction);
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

    // Test API availability by testing multiple models (same as chat fallback)
    let isAvailable = false;
    let availabilityStatus = '❌ Unavailable';
    let errorReason = '';
    let workingModel = '';

    const modelsToTest = [
        'gemini-flash-latest',
        'gemini-2.0-flash',
        'gemini-2.5-flash'
    ];

    for (const modelName of modelsToTest) {
        try {
            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: modelName });

            // Simple test request
            const result = await model.generateContent('Hi');
            const response = await result.response;

            if (response.text()) {
                isAvailable = true;
                availabilityStatus = '✅ Available';
                workingModel = modelName;
                break; // Found a working model, stop testing
            }
        } catch (error) {
            // Continue to next model if this one fails
            if (error.message.includes('429')) {
                errorReason = 'Rate limited on ' + modelName;
            } else if (error.message.includes('403')) {
                errorReason = 'API key tidak valid atau diblokir.';
                break; // No point testing other models
            } else if (error.message.includes('503')) {
                errorReason = 'Server ' + modelName + ' sedang sibuk.';
            } else if (error.message.includes('404')) {
                errorReason = modelName + ' tidak ditemukan.';
            } else {
                errorReason = error.message.substring(0, 50);
            }
            continue;
        }
    }

    // Set final status if all models failed
    if (!isAvailable) {
        if (errorReason.includes('Rate limited')) {
            availabilityStatus = '⚠️ Rate Limited (semua model)';
        } else if (errorReason.includes('403')) {
            availabilityStatus = '🚫 Forbidden';
        } else {
            availabilityStatus = '❌ Error';
        }
    }

    const embed = new EmbedBuilder()
        .setTitle('🤖 Gemini AI Dashboard')
        .setColor(isAvailable ? '#4285F4' : '#FF5555')
        .setThumbnail('https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg')
        .addFields(
            { name: '🟢 AI Available?', value: availabilityStatus, inline: true },
            { name: '📊 API Key', value: '✅ Configured', inline: true },
            { name: '🎯 Active Model', value: workingModel ? `\`${workingModel}\`` : '_None_', inline: true },
            { name: '🔧 Models Tested', value: '`gemini-flash-latest`\n`gemini-2.0-flash`\n`gemini-2.5-flash`', inline: true },
            { name: '💰 Tier', value: 'Free', inline: true },
            { name: '📈 Rate Limits', value: '5 RPM\n250K TPM\n20 RPD', inline: true },
            {
                name: '📝 Notes', value:
                    '• RPM = Requests Per Minute\n' +
                    '• TPM = Tokens Per Minute\n' +
                    '• RPD = Requests Per Day'
            }
        )
        .setFooter({ text: 'Powered by Google AI | Tested all models' })
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

async function showOpenRouterDashboard(interaction) {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        return interaction.editReply({
            content: '❌ `OPENROUTER_API_KEY` tidak ditemukan di `.env`!'
        });
    }

    let creditBalance = 'Unknown';
    let usageInfo = 'Unknown';
    let isAvailable = false;
    let rateLimit = 'Unknown';

    try {
        // Fetch key info from OpenRouter
        const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            isAvailable = true;

            const info = data.data || data;

            // Credit limit (null = unlimited for free tier)
            if (info.limit !== null && info.limit !== undefined) {
                creditBalance = `$${Number(info.limit).toFixed(4)}`;
            } else {
                creditBalance = info.is_free_tier ? '♾️ Free Tier' : 'Unlimited';
            }

            // Usage stats
            usageInfo = `$${Number(info.usage || 0).toFixed(4)}`;

            // Daily/Monthly usage
            const dailyUsage = `$${Number(info.usage_daily || 0).toFixed(4)}`;
            const monthlyUsage = `$${Number(info.usage_monthly || 0).toFixed(4)}`;
            rateLimit = `Daily: ${dailyUsage}\nMonthly: ${monthlyUsage}`;

        } else {
            console.error('OpenRouter API error status:', response.status);
        }
    } catch (error) {
        console.error('OpenRouter API error:', error);
    }

    const embed = new EmbedBuilder()
        .setTitle('🟢 OpenRouter Dashboard')
        .setColor(isAvailable ? '#00D4AA' : '#FF5555')
        .addFields(
            { name: '🔌 Status', value: isAvailable ? '✅ Connected' : '❌ Error', inline: true },
            { name: '📊 API Key', value: '✅ Configured', inline: true },
            { name: '🤖 Model', value: '`deepseek-r1t2-chimera`', inline: true },
            { name: '� Tier', value: creditBalance, inline: true },
            { name: '📈 Total Usage', value: usageInfo, inline: true },
            { name: '📊 Usage Stats', value: rateLimit, inline: true }
        )
        .setFooter({ text: 'Powered by OpenRouter.ai' })
        .setTimestamp();

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
