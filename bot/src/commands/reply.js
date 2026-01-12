const { ContextMenuCommandBuilder, ApplicationCommandType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Reply as Bot')
        .setType(ApplicationCommandType.Message)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        // Store the target message info in the modal's customId
        const targetMessage = interaction.targetMessage;

        // Create modal for reply input
        const modal = new ModalBuilder()
            .setCustomId(`reply_modal_${targetMessage.channelId}_${targetMessage.id}`)
            .setTitle('Reply as Bot');

        const replyInput = new TextInputBuilder()
            .setCustomId('reply_content')
            .setLabel('Pesan Reply')
            .setPlaceholder('Ketik pesan untuk reply... (bisa @mention atau #channel)')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
            .setMaxLength(2000);

        const actionRow = new ActionRowBuilder().addComponents(replyInput);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);
    }
};
