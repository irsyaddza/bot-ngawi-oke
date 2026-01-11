const { ContextMenuCommandBuilder, ApplicationCommandType, AttachmentBuilder } = require('discord.js');
const path = require('path');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('siapo?')
        .setType(ApplicationCommandType.Message),

    async execute(interaction) {
        // Defer reply immediately to prevent timeout
        await interaction.deferReply({ ephemeral: true });

        const targetMessage = interaction.targetMessage;

        try {
            // Load the siapo image from assets
            const imagePath = path.join(__dirname, '..', 'assets', 'siapo.png');
            const attachment = new AttachmentBuilder(imagePath, { name: 'siapo.png' });

            // Reply to the target message with the image
            await targetMessage.reply({
                files: [attachment]
            });

            await interaction.editReply({
                content: '✅ Siapo sent!'
            });

        } catch (error) {
            console.error('Siapo error:', error);
            await interaction.editReply({
                content: '❌ Gagal kirim gambar siapo!'
            });
        }
    }
};
