// Analytics Scheduler - Weekly report cron job
const cron = require('node-cron');
const { getAllAnalyticsConfigs } = require('./analyticsDB');
const { generateWeeklyReport } = require('./analyticsReport');

/**
 * Start the analytics scheduler
 */
function startAnalyticsScheduler(client) {
    // Run every hour to check if any server needs a report
    cron.schedule('0 * * * *', async () => {
        const now = new Date();
        const currentDay = now.getDay(); // 0 = Sunday
        const currentHour = now.getHours();

        const configs = getAllAnalyticsConfigs();

        for (const config of configs) {
            // Check if it's time to send report for this server
            if (config.send_day === currentDay && config.send_hour === currentHour) {
                console.log(`[Analytics] Sending weekly report for guild ${config.guild_id}`);

                try {
                    const channel = await client.channels.fetch(config.channel_id);
                    if (!channel) {
                        console.error(`[Analytics] Channel ${config.channel_id} not found`);
                        continue;
                    }

                    const embed = await generateWeeklyReport(client, config.guild_id);
                    await channel.send({
                        content: '@everyone 📊 **Weekly Report sudah keluar!**',
                        embeds: [embed]
                    });

                    console.log(`[Analytics] Report sent to ${channel.name}`);
                } catch (error) {
                    console.error(`[Analytics] Failed to send report:`, error.message);
                }
            }
        }
    });

    console.log('[Analytics] Scheduler started - checking every hour');
}

module.exports = { startAnalyticsScheduler };
