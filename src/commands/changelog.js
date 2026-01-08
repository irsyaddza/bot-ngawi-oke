const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const GITHUB_REPO = 'irsyaddza/bot-ngawi-oke';
const COMMITS_PER_PAGE = 5;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('changelog')
        .setDescription('Lihat history commit dari GitHub repository'),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            // Fetch commits from GitHub API
            const commits = await fetchCommits();

            if (!commits || commits.length === 0) {
                return interaction.editReply({
                    content: '❌ Tidak ada commits ditemukan atau gagal mengambil data dari GitHub.'
                });
            }

            // Create paginated view
            const totalPages = Math.ceil(commits.length / COMMITS_PER_PAGE);
            let currentPage = 0;

            const embed = createChangelogEmbed(commits, currentPage, totalPages);
            const buttons = createPaginationButtons(currentPage, totalPages);

            const response = await interaction.editReply({
                embeds: [embed],
                components: totalPages > 1 ? [buttons] : []
            });

            // Handle button interactions
            if (totalPages > 1) {
                const collector = response.createMessageComponentCollector({
                    time: 300000 // 5 minutes
                });

                collector.on('collect', async (i) => {
                    if (i.user.id !== interaction.user.id) {
                        return i.reply({ content: '❌ Tombol ini bukan untukmu!', ephemeral: true });
                    }

                    if (i.customId === 'changelog_prev') {
                        currentPage = Math.max(0, currentPage - 1);
                    } else if (i.customId === 'changelog_next') {
                        currentPage = Math.min(totalPages - 1, currentPage + 1);
                    } else if (i.customId === 'changelog_first') {
                        currentPage = 0;
                    } else if (i.customId === 'changelog_last') {
                        currentPage = totalPages - 1;
                    }

                    const newEmbed = createChangelogEmbed(commits, currentPage, totalPages);
                    const newButtons = createPaginationButtons(currentPage, totalPages);

                    await i.update({
                        embeds: [newEmbed],
                        components: [newButtons]
                    });
                });

                collector.on('end', async () => {
                    try {
                        const disabledButtons = createPaginationButtons(currentPage, totalPages, true);
                        await interaction.editReply({ components: [disabledButtons] });
                    } catch (e) {
                        // Message might be deleted
                    }
                });
            }

        } catch (error) {
            console.error('[Changelog Error]', error);
            await interaction.editReply({
                content: `❌ Error: ${error.message}`
            });
        }
    }
};

async function fetchCommits() {
    const token = process.env.GITHUB_TOKEN;
    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Discord-Bot'
    };

    // Add token if available (for private repos)
    if (token) {
        headers['Authorization'] = `token ${token}`;
    }

    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/commits?per_page=50`, {
        headers
    });

    if (!response.ok) {
        throw new Error(`GitHub API Error: ${response.status}`);
    }

    return response.json();
}

function createChangelogEmbed(commits, page, totalPages) {
    const start = page * COMMITS_PER_PAGE;
    const end = start + COMMITS_PER_PAGE;
    const pageCommits = commits.slice(start, end);

    const embed = new EmbedBuilder()
        .setTitle('📝 Changelog')
        .setDescription(`Latest commits from [${GITHUB_REPO}](https://github.com/${GITHUB_REPO})`)
        .setColor('#24292e')
        .setFooter({ text: `Page ${page + 1} of ${totalPages} • ${commits.length} total commits` })
        .setTimestamp();

    for (const commit of pageCommits) {
        const sha = commit.sha.substring(0, 7);
        const message = commit.commit.message.split('\n')[0]; // First line only
        const author = commit.commit.author.name;
        const date = new Date(commit.commit.author.date);
        const relativeTime = getRelativeTime(date);

        // Truncate message if too long
        const truncatedMessage = message.length > 60 ? message.substring(0, 57) + '...' : message;

        embed.addFields({
            name: `\`${sha}\` ${truncatedMessage}`,
            value: `👤 ${author} • 🕐 ${relativeTime}`,
            inline: false
        });
    }

    return embed;
}

function createPaginationButtons(currentPage, totalPages, disabled = false) {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('changelog_first')
                .setLabel('⏮️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(disabled || currentPage === 0),
            new ButtonBuilder()
                .setCustomId('changelog_prev')
                .setLabel('◀️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(disabled || currentPage === 0),
            new ButtonBuilder()
                .setCustomId('changelog_page')
                .setLabel(`${currentPage + 1}/${totalPages}`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId('changelog_next')
                .setLabel('▶️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(disabled || currentPage === totalPages - 1),
            new ButtonBuilder()
                .setCustomId('changelog_last')
                .setLabel('⏭️')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(disabled || currentPage === totalPages - 1)
        );
}

function getRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 30) {
        return date.toLocaleDateString('id-ID');
    } else if (diffDay > 0) {
        return `${diffDay} hari lalu`;
    } else if (diffHour > 0) {
        return `${diffHour} jam lalu`;
    } else if (diffMin > 0) {
        return `${diffMin} menit lalu`;
    } else {
        return 'Baru saja';
    }
}
