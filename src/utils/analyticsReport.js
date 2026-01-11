// Analytics Report Generator - Weekly report with AI
const { EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const {
    getWeeklyMessageStats,
    getWeeklyVoiceStats,
    getDailyMessageBreakdown,
    getChannelStats,
    getLastWeekTotal
} = require('./analyticsDB');

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

/**
 * Generate QuickChart URL for visual bar chart
 */
function generateChartUrl(dailyData) {
    if (!dailyData || dailyData.length === 0) return null;

    const labels = dailyData.map(d => DAY_NAMES[parseInt(d.day_of_week)]);
    const data = dailyData.map(d => d.count);
    const maxIdx = data.indexOf(Math.max(...data));

    // Create gradient colors (peak day = orange, others = blue)
    const backgroundColors = data.map((_, i) =>
        i === maxIdx ? 'rgba(255, 159, 64, 0.8)' : 'rgba(88, 101, 242, 0.8)'
    );
    const borderColors = data.map((_, i) =>
        i === maxIdx ? 'rgba(255, 159, 64, 1)' : 'rgba(88, 101, 242, 1)'
    );

    const chartConfig = {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Messages',
                data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: '📈 Aktivitas Harian',
                    color: '#ffffff',
                    font: { size: 18, weight: 'bold' }
                },
                legend: { display: false },
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    color: '#ffffff',
                    font: { weight: 'bold', size: 12 }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { color: '#ffffff' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#ffffff', font: { weight: 'bold' } }
                }
            }
        }
    };

    const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&backgroundColor=%23313338&width=600&height=300`;
    return chartUrl;
}

/**
 * Generate ASCII bar graph (fallback)
 */
function generateASCIIGraph(dailyData) {
    if (!dailyData || dailyData.length === 0) {
        return 'No data available';
    }

    const maxCount = Math.max(...dailyData.map(d => d.count));
    const maxBars = 15;

    let graph = '';
    for (const day of dailyData) {
        const dayName = DAY_NAMES[parseInt(day.day_of_week)];
        const barLength = Math.round((day.count / maxCount) * maxBars);
        const bar = '▓'.repeat(barLength) + '░'.repeat(maxBars - barLength);
        const peak = day.count === maxCount ? ' 🔥' : '';
        const countStr = day.count.toLocaleString().padStart(5);
        graph += `${dayName} │${bar}│ ${countStr}${peak}\n`;
    }

    return graph.trim();
}

/**
 * Format seconds to human readable
 */
function formatDuration(seconds) {
    if (!seconds || seconds < 60) return '< 1m';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
        return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
}

/**
 * Generate AI content for the report using current logic provider
 */
async function generateAIContent(data, guildId) {
    const { getLogic } = require('./logicState');
    const currentLogic = getLogic(guildId);

    const prompt = `Kamu adalah Rusdi, bot Discord dengan gaya santai, lucu, dan sedikit nyinyir.

DATA AKTIVITAS SERVER MINGGU INI:
- Total messages: ${data.totalMessages} (minggu lalu: ${data.lastWeekMessages})
- Total voice hours: ${formatDuration(data.totalVoiceSeconds)}
- Active members: ${data.activeMembers}
- Peak day: ${data.peakDay} (${data.peakCount} messages)

TOP 5 MEMBERS:
${data.topMembers.slice(0, 5).map((m, i) =>
        `${i + 1}. User ${m.user_id}: ${m.message_count || 0} msg, ${formatDuration(m.voice_seconds || 0)} voice`
    ).join('\n')}

TUGAS: Buatkan weekly report dengan format JSON (HANYA JSON, tanpa markdown):
{
  "narasi": "1-2 paragraf pembuka yang engaging, max 200 kata...",
  "roasts": [
    {"user_id": "${data.topMembers[0]?.user_id || '0'}", "roast": "komentar lucu..."},
    {"user_id": "${data.topMembers[1]?.user_id || '0'}", "roast": "komentar lucu..."},
    {"user_id": "${data.topMembers[2]?.user_id || '0'}", "roast": "komentar lucu..."},
    {"user_id": "${data.topMembers[3]?.user_id || '0'}", "roast": "komentar lucu..."},
    {"user_id": "${data.topMembers[4]?.user_id || '0'}", "roast": "komentar lucu..."}
  ],
  "insights": ["insight 1", "insight 2", "insight 3"],
  "prediksi": "prediksi singkat..."
}

RULES:
- Gaya bahasa: casual, campur Indo-Inggris, pake "gue/lu"
- Roast harus lucu tapi gak offensive
- Response HARUS valid JSON`;

    try {
        let responseText = '';

        if (currentLogic === 'deepseek') {
            // Use OpenRouter (DeepSeek)
            const openRouterKey = process.env.OPENROUTER_API_KEY;
            if (!openRouterKey) {
                console.warn('[Analytics] ⚠️ OPENROUTER_API_KEY not found! Using fallback.');
                throw new Error('No OpenRouter API key');
            }

            console.log('[Analytics] Generating AI content with DeepSeek (OpenRouter)...');

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${openRouterKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://discord-bot.local',
                    'X-Title': 'Rusdi Bot Analytics'
                },
                body: JSON.stringify({
                    model: 'tngtech/deepseek-r1t2-chimera:free',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 1000
                })
            });

            const result = await response.json();
            if (result.error) throw new Error(result.error.message || 'OpenRouter error');
            responseText = result.choices?.[0]?.message?.content || '';

        } else {
            // Use Gemini
            const geminiKey = process.env.GEMINI_API_KEY;
            if (!geminiKey) {
                console.warn('[Analytics] ⚠️ GEMINI_API_KEY not found! Using fallback.');
                throw new Error('No Gemini API key');
            }

            console.log('[Analytics] Generating AI content with Gemini...');

            const genAI = new GoogleGenerativeAI(geminiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            const result = await model.generateContent(prompt);
            responseText = result.response.text().trim();
        }

        // Parse JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            console.log(`[Analytics] AI content generated successfully using ${currentLogic}`);
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error('No valid JSON in response');

    } catch (error) {
        console.error(`[Analytics] AI generation error (${currentLogic}):`, error.message);
        return {
            narasi: `Weekly report minggu ini! Ada ${data.totalMessages} pesan dan ${formatDuration(data.totalVoiceSeconds)} voice time. Keep it up! 🔥`,
            roasts: data.topMembers.slice(0, 5).map(m => ({ user_id: m.user_id, roast: 'Good job!' })),
            insights: ['Server aktif minggu ini!', 'Keep the energy going!'],
            prediksi: 'Semoga minggu depan lebih rame lagi!'
        };
    }
}

/**
 * Build the complete weekly report embed
 */
async function generateWeeklyReport(client, guildId) {
    // Get all stats
    const messageStats = getWeeklyMessageStats(guildId);
    const voiceStats = getWeeklyVoiceStats(guildId);
    const dailyBreakdown = getDailyMessageBreakdown(guildId);
    const lastWeek = getLastWeekTotal(guildId);

    // Calculate totals
    const totalMessages = messageStats.reduce((sum, u) => sum + u.message_count, 0);
    const totalVoiceSeconds = voiceStats.reduce((sum, u) => sum + (u.total_seconds || 0), 0);
    const activeMembers = new Set([...messageStats.map(m => m.user_id), ...voiceStats.map(v => v.user_id)]).size;

    // Find peak day
    let peakDay = 'N/A';
    let peakCount = 0;
    for (const day of dailyBreakdown) {
        if (day.count > peakCount) {
            peakCount = day.count;
            peakDay = DAY_NAMES[parseInt(day.day_of_week)];
        }
    }

    // Merge message and voice stats for top members
    const memberMap = new Map();
    for (const m of messageStats) {
        memberMap.set(m.user_id, { user_id: m.user_id, message_count: m.message_count, voice_seconds: 0 });
    }
    for (const v of voiceStats) {
        if (memberMap.has(v.user_id)) {
            memberMap.get(v.user_id).voice_seconds = v.total_seconds;
        } else {
            memberMap.set(v.user_id, { user_id: v.user_id, message_count: 0, voice_seconds: v.total_seconds });
        }
    }
    const topMembers = Array.from(memberMap.values())
        .sort((a, b) => (b.message_count + b.voice_seconds / 60) - (a.message_count + a.voice_seconds / 60))
        .slice(0, 10);

    // Prepare data for AI
    const data = {
        totalMessages,
        totalVoiceSeconds,
        lastWeekMessages: lastWeek?.count || 0,
        activeMembers,
        peakDay,
        peakCount,
        topMembers
    };

    // Generate AI content (uses /logic setting)
    const aiContent = await generateAIContent(data, guildId);

    // Calculate week-over-week change
    const msgChange = data.lastWeekMessages > 0
        ? Math.round(((totalMessages - data.lastWeekMessages) / data.lastWeekMessages) * 100)
        : 0;
    const msgTrend = msgChange >= 0 ? `+${msgChange}% ⬆️` : `${msgChange}% ⬇️`;

    // Build leaderboard with roasts (cleaner format)
    let leaderboard = '';
    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
    for (let i = 0; i < Math.min(5, topMembers.length); i++) {
        const m = topMembers[i];
        const roast = aiContent.roasts?.find(r => r.user_id === m.user_id)?.roast || '';
        leaderboard += `${medals[i]} <@${m.user_id}>\n`;
        leaderboard += `╰ 💬 ${m.message_count} msg  •  🎙️ ${formatDuration(m.voice_seconds)}\n`;
        if (roast) leaderboard += `╰ *"${roast}"*\n`;
        leaderboard += '\n';
    }

    // Get date range
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dateRange = `${weekAgo.toLocaleDateString('id-ID')} - ${now.toLocaleDateString('id-ID')}`;

    // Generate chart URL
    const chartUrl = generateChartUrl(dailyBreakdown);
    const graph = generateASCIIGraph(dailyBreakdown); // Fallback

    // Build embed with improved styling
    const embed = new EmbedBuilder()
        .setColor('#5865F2') // Discord blurple
        .setTitle(`📊 WEEKLY SERVER REPORT`)
        .setDescription(`
**📅 ${dateRange}**

${aiContent.narasi}
        `.trim())
        .addFields(
            {
                name: '🏆 TOP 5 LEADERBOARD',
                value: leaderboard || 'No activity this week',
                inline: false
            },
            {
                name: '💡 AI INSIGHTS',
                value: (aiContent.insights || []).map((insight, i) => `**${i + 1}.** ${insight}`).join('\n') || 'No insights',
                inline: false
            },
            {
                name: '📊 WEEKLY STATS',
                value: `
💬 **Messages:** ${totalMessages.toLocaleString()} (${msgTrend})
🎙️ **Voice Time:** ${formatDuration(totalVoiceSeconds)}
👥 **Active Members:** ${activeMembers}
                `.trim(),
                inline: true
            },
            {
                name: '🔮 PREDIKSI',
                value: `> ${aiContent.prediksi || 'Keep up the good work!'}`,
                inline: true
            }
        )
        .setTimestamp()
        .setFooter({ text: '🤖 Powered by Rusdi Analytics • /analytics stats untuk stats pribadi' });

    // Add chart as image if available, otherwise use ASCII in field
    if (chartUrl) {
        embed.setImage(chartUrl);
    } else {
        embed.spliceFields(0, 0, {
            name: '📈 AKTIVITAS HARIAN',
            value: '```\n' + graph + '\n```',
            inline: false
        });
    }

    return embed;
}

module.exports = {
    generateWeeklyReport,
    formatDuration
};
