const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('⏹️ Stop the music and clear the queue'),

    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;
        const queue = interaction.client.distube.getQueue(interaction.guildId);

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

        if (!queue) {
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
            await queue.stop();
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#a200ff')
                        .setDescription('⏹️ Stopped the music and cleared the queue!')
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
