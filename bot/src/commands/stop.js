const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('⏹️ Stop the music and clear the queue'),

    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;
        const player = interaction.client.kazagumo?.players.get(interaction.guildId);

        if (!voiceChannel) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('❌ You must be in a voice channel!')
                ],
                ephemeral: true
            });
        }

        if (!player) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('❌ There is nothing playing!')
                ],
                ephemeral: true
            });
        }

        try {
            // Stop and destroy player (clears queue and disconnects)
            player.destroy();

            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#a200ff')
                        .setDescription('⏹️ Stopped the music and disconnected!')
                ]
            });
        } catch (error) {
            console.error('Stop command error:', error);
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Red')
                        .setDescription(`❌ Error: ${error.message}`)
                ],
                ephemeral: true
            });
        }
    }
};
