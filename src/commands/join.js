const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus, entersState, getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Bot akan join ke voice channel')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Pilih voice channel (kosongkan untuk join ke channel kamu)')
                .addChannelTypes(ChannelType.GuildVoice, ChannelType.GuildStageVoice)
                .setRequired(false)
        ),

    async execute(interaction) {
        const member = interaction.member;

        // Get channel from option or from user's current voice channel
        let voiceChannel = interaction.options.getChannel('channel');

        if (!voiceChannel) {
            voiceChannel = member.voice.channel;
        }

        if (!voiceChannel) {
            return interaction.reply({
                content: '❌ Pilih voice channel atau masuk ke voice channel terlebih dahulu!',
                ephemeral: true
            });
        }

        // Reply immediately to avoid timeout (ephemeral)
        await interaction.deferReply({ ephemeral: true });

        try {
            // Destroy any existing voice connection first (including DisTube's)
            const existingConnection = getVoiceConnection(interaction.guild.id);
            if (existingConnection) {
                existingConnection.destroy();
                // Small delay to ensure cleanup
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            // Also try to stop DisTube queue if exists
            const queue = interaction.client.distube?.getQueue(interaction.guildId);
            if (queue) {
                try {
                    await queue.stop();
                } catch (e) {
                    // Ignore if already stopped
                }
                // Wait for DisTube to cleanup
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false // Unmute so TTS can work
            });

            // Wait for connection to be ready with shorter timeout
            await entersState(connection, VoiceConnectionStatus.Ready, 15_000);

            await interaction.editReply({
                content: `✅ Berhasil join ke **${voiceChannel.name}**!`
            });
        } catch (error) {
            console.error('Error joining voice channel:', error);
            await interaction.editReply({
                content: '❌ Gagal join ke voice channel. Coba lagi dalam beberapa detik.'
            });
        }
    }
};

