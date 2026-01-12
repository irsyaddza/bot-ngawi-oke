const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { VOICES, setVoice, getVoiceInfo } = require('../utils/voiceSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('changevoice')
        .setDescription('Ganti suara TTS bot'),

    async execute(interaction) {
        const currentVoice = getVoiceInfo(interaction.guild.id);

        // Build select menu options from VOICES
        const options = Object.entries(VOICES).map(([key, voice]) => ({
            label: `${voice.emoji} ${voice.name} (${voice.description})`,
            value: key,
            description: `Gunakan suara ${voice.name}`,
            default: voice.id === currentVoice.id
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('voice_select')
            .setPlaceholder('Pilih suara...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const response = await interaction.reply({
            content: `🎙️ **Pilih Suara TTS**\nSuara saat ini: ${currentVoice.emoji} **${currentVoice.name}**`,
            components: [row],
            ephemeral: true
        });

        // Wait for selection
        try {
            const collector = response.createMessageComponentCollector({
                time: 60000 // 1 minute timeout
            });

            collector.on('collect', async (i) => {
                if (i.customId === 'voice_select') {
                    const selectedKey = i.values[0];
                    const success = setVoice(interaction.guild.id, selectedKey);

                    if (success) {
                        const newVoice = VOICES[selectedKey];
                        await i.update({
                            content: `✅ Suara TTS berhasil diubah menjadi ${newVoice.emoji} **${newVoice.name}** (${newVoice.description})!`,
                            components: []
                        });
                    } else {
                        await i.update({
                            content: '❌ Gagal mengubah suara. Silakan coba lagi.',
                            components: []
                        });
                    }
                    collector.stop();
                }
            });

            collector.on('end', async (collected, reason) => {
                if (reason === 'time' && collected.size === 0) {
                    await interaction.editReply({
                        content: '⏱️ Waktu habis. Gunakan `/changevoice` lagi untuk memilih suara.',
                        components: []
                    });
                }
            });

        } catch (error) {
            console.error('Voice selection error:', error);
        }
    }
};
