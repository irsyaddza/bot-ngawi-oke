const { Events, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    execute: async (interaction) => {
        // Handle Slash Commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Error executing ${interaction.commandName}`);
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
            return;
        }

        // Handle Context Menu Commands
        if (interaction.isMessageContextMenuCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No context menu command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Error executing context menu ${interaction.commandName}`);
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
            return;
        }

        // Handle Modal Submissions
        if (interaction.isModalSubmit()) {
            // Handle Reply Modal
            if (interaction.customId.startsWith('reply_modal_')) {
                try {
                    // Parse channelId and messageId from customId
                    const parts = interaction.customId.split('_');
                    const channelId = parts[2];
                    const messageId = parts[3];

                    const replyContent = interaction.fields.getTextInputValue('reply_content');

                    // Get the channel and message
                    const channel = await interaction.client.channels.fetch(channelId);
                    const targetMessage = await channel.messages.fetch(messageId);

                    // Check bot permissions
                    const botPermissions = channel.permissionsFor(interaction.client.user);
                    if (!botPermissions.has(PermissionFlagsBits.SendMessages)) {
                        return interaction.reply({
                            content: `❌ Bot tidak memiliki izin untuk mengirim pesan di channel ini!`,
                            ephemeral: true
                        });
                    }

                    // Reply to the message
                    await targetMessage.reply({
                        content: replyContent,
                        allowedMentions: {
                            parse: ['users', 'roles'],
                            repliedUser: true
                        }
                    });

                    await interaction.reply({
                        content: `✅ Berhasil reply ke pesan dari **${targetMessage.author.username}**!`,
                        ephemeral: true
                    });

                } catch (error) {
                    console.error('Reply modal error:', error);
                    await interaction.reply({
                        content: '❌ Gagal mengirim reply. Pastikan pesan masih ada dan bot memiliki izin.',
                        ephemeral: true
                    });
                }
            }
            return;
        }
    },
};
