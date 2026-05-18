const { SlashCommandBuilder } = require('discord.js');
const { disableBell, enableBell, isBellEnabled } = require('../utils/bellSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('offbell')
        .setDescription('Nonaktifkan atau aktifkan bel peringatan')
        .addStringOption(option =>
            option.setName('status')
                .setDescription('Aktifkan atau matikan bel')
                .setRequired(true)
                .addChoices(
                    { name: 'Matikan Bell', value: 'off' },
                    { name: 'Aktifkan Bell', value: 'on' }
                )
        ),

    async execute(interaction) {
        const status = interaction.options.getString('status');
        const isOff = status === 'off';

        if (isOff) {
            disableBell(interaction.guild.id);
            return await interaction.reply({
                content: `✅ Bell peringatan berhasil **dimatikan**.\n🔇 Voice welcome hanya akan memainkan TTS tanpa bel.`,
                ephemeral: true
            });
        } else {
            enableBell(interaction.guild.id);
            return await interaction.reply({
                content: `✅ Bell peringatan berhasil **diaktifkan**.\n🔔 Voice welcome akan memainkan bel sebelum TTS.`,
                ephemeral: true
            });
        }
    }
};
