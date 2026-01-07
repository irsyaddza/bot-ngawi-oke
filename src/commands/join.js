const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus, entersState } = require('@discordjs/voice');

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
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false // Unmute so TTS can work
            });

            // Wait for connection to be ready
            await entersState(connection, VoiceConnectionStatus.Ready, 30_000);

            await interaction.editReply({
                content: `✅ Berhasil join ke **${voiceChannel.name}**!`
            });
        } catch (error) {
            console.error('Error joining voice channel:', error);
            await interaction.editReply({
                content: '❌ Gagal join ke voice channel. Silakan coba lagi.'
            });
        }
    }
};
