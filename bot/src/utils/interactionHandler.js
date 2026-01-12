const { EmbedBuilder } = require('discord.js');

// Templates for actions
const TEMPLATES = {
    gampar: [
        "🖐️ **{author}** nampar **{target}** sampe melayang ke langit!",
        "👋 **{target}** kena gampar dari **{author}**. Sakit cuk!",
        "💥 PLAK! **{author}** gampar **{target}** tanpa ampun!",
        "🫲 **{author}** nampar **{target}** pake sendal jepit!",
        "😵 **{target}** kena tamparan maut dari **{author}**!"
    ],
    slap: [
        "👋 **{author}** slapped **{target}**!",
        "🖐️ **{author}** gave **{target}** a big slap!",
        "💢 **{target}** got slapped by **{author}**! Ouch!",
        "😤 **{author}** angrily slapped **{target}**!",
        "👊 **{target}** received a powerful slap from **{author}**!"
    ],
    kiss: [
        "💋 **{author}** kissed **{target}**~",
        "😘 **{author}** gave **{target}** a sweet kiss!",
        "💕 **{target}** got kissed by **{author}**! Aww~",
        "❤️ **{author}** kissed **{target}** on the cheek!",
        "😚 So sweet! **{author}** kissed **{target}**!"
    ],
    hug: [
        "🤗 **{author}** hugged **{target}** tightly!",
        "💕 **{author}** gave **{target}** a warm hug!",
        "🫂 **{target}** received a big hug from **{author}**!",
        "❤️ **{author}** wrapped their arms around **{target}**!",
        "😊 So wholesome! **{author}** hugged **{target}**!"
    ]
};

// Duel outcomes
const DUEL_OUTCOMES = [
    {
        result: 'win', messages: [
            "⚔️ **{author}** menang duel melawan **{target}**! GG!",
            "🏆 **{author}** mengalahkan **{target}** dengan telak!",
            "💪 **{target}** kalah telak dari **{author}**!"
        ]
    },
    {
        result: 'lose', messages: [
            "😵 **{author}** kalah duel dari **{target}**! Lemah!",
            "🪦 **{target}** menghajar **{author}** sampe babak belur!",
            "💀 **{author}** dibantai habis sama **{target}**!"
        ]
    },
    {
        result: 'draw', messages: [
            "🤝 Duel antara **{author}** dan **{target}** berakhir seri!",
            "⚖️ Seimbang! **{author}** vs **{target}** = DRAW!",
            "😅 Gak ada pemenang! **{author}** dan **{target}** sama kuatnya!"
        ]
    }
];

// Fetch GIF from API
async function fetchGif(action) {
    const endpoints = {
        slap: 'https://nekos.life/api/v2/img/slap',
        kiss: 'https://nekos.life/api/v2/img/kiss',
        hug: 'https://nekos.life/api/v2/img/hug',
        pat: 'https://nekos.life/api/v2/img/pat',
        gampar: 'https://nekos.life/api/v2/img/slap' // use slap for gampar
    };

    try {
        const response = await fetch(endpoints[action] || endpoints.slap);
        const data = await response.json();
        return data.url;
    } catch (e) {
        return null;
    }
}

// Random helper
function random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Format template
function formatTemplate(template, author, target) {
    return template.replace(/{author}/g, author).replace(/{target}/g, target);
}

// Handle template-based actions (gampar, slap, kiss, hug)
async function handleTemplateAction(message, action, target) {
    const templates = TEMPLATES[action];
    if (!templates) return null;

    const text = formatTemplate(random(templates), message.author.username, target.username);
    const gifUrl = await fetchGif(action);

    const embed = new EmbedBuilder()
        .setColor('#FF69B4')
        .setDescription(text);

    if (gifUrl) {
        embed.setImage(gifUrl);
    }

    return message.reply({ embeds: [embed] });
}

// Handle duel
async function handleDuel(message, target) {
    // Random outcome with weights
    const rand = Math.random();
    let outcome;
    if (rand < 0.4) outcome = DUEL_OUTCOMES[0]; // 40% win
    else if (rand < 0.8) outcome = DUEL_OUTCOMES[1]; // 40% lose
    else outcome = DUEL_OUTCOMES[2]; // 20% draw

    const text = formatTemplate(random(outcome.messages), message.author.username, target.username);

    const colors = { win: '#00FF00', lose: '#FF0000', draw: '#FFAA00' };
    const emojis = { win: '🏆', lose: '💀', draw: '🤝' };

    const embed = new EmbedBuilder()
        .setColor(colors[outcome.result])
        .setTitle(`${emojis[outcome.result]} Duel Result`)
        .setDescription(text);

    return message.reply({ embeds: [embed] });
}

// Handle ship (love percentage)
async function handleShip(message, user1, user2) {
    // Generate consistent percentage based on user IDs
    const combined = [user1.id, user2.id].sort().join('');
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
        hash = ((hash << 5) - hash) + combined.charCodeAt(i);
        hash = hash & hash;
    }
    const percentage = Math.abs(hash) % 101;

    // Create progress bar
    const filled = Math.round(percentage / 10);
    const empty = 10 - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);

    // Determine status
    let status, color;
    if (percentage >= 80) { status = '💕 PERFECT MATCH!'; color = '#FF69B4'; }
    else if (percentage >= 60) { status = '❤️ Great potential!'; color = '#FF6B6B'; }
    else if (percentage >= 40) { status = '💛 Could work!'; color = '#FFD93D'; }
    else if (percentage >= 20) { status = '💔 Not looking good...'; color = '#808080'; }
    else { status = '💀 RIP'; color = '#000000'; }

    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle('💕 Love Calculator')
        .setDescription(`**${user1.username}** ❤️ **${user2.username}**`)
        .addFields(
            { name: 'Compatibility', value: `\`${bar}\` **${percentage}%**`, inline: false },
            { name: 'Status', value: status, inline: false }
        );

    return message.reply({ embeds: [embed] });
}

// Parse interaction from message content
function parseInteraction(content, message) {
    const lowerContent = content.toLowerCase().trim();
    const mentionedUsers = message.mentions.users.filter(u => u.id !== message.client.user.id);

    // Check for actions
    const actions = ['gampar', 'slap', 'kiss', 'hug', 'pat', 'duel', 'ship', 'roast'];

    for (const action of actions) {
        if (lowerContent.startsWith(action)) {
            if (action === 'ship') {
                // Ship needs 2 users
                const users = Array.from(mentionedUsers.values());
                if (users.length >= 2) {
                    return { action, targets: [users[0], users[1]] };
                } else if (users.length === 1) {
                    return { action, targets: [message.author, users[0]] };
                }
            } else {
                // Other actions need 1 target
                const target = mentionedUsers.first();
                if (target) {
                    return { action, target };
                }
            }
        }
    }

    return null;
}

module.exports = {
    TEMPLATES,
    handleTemplateAction,
    handleDuel,
    handleShip,
    parseInteraction
};
