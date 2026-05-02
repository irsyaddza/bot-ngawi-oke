// Guild Delete Event - Triggered when bot leaves/is removed from a server

module.exports = {
    name: 'guildDelete',
    once: false,

    execute(guild) {
        console.log(`[Guild] ❌ Left server!`);
        console.log(`[Guild] 📛 Name: ${guild.name}`);
        console.log(`[Guild] 🆔 ID: ${guild.id}`);
        console.log(`[Guild] 👥 Members: ${guild.memberCount}`);

        // Note: We intentionally do NOT delete guild data
        // This preserves analytics and allows for potential re-invite
        console.log(`[Guild] 📊 Data preserved for analytics purposes`);
    }
};
