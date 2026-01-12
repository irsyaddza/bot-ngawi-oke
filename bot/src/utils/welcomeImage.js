const { Canvas, GlobalFonts } = require('@napi-rs/canvas');
const { AttachmentBuilder } = require('discord.js');
const request = require('undici').request;

module.exports = {
    generateWelcomeImage: async (member, type = 'welcome') => {
        const canvas = new Canvas(700, 250);
        const context = canvas.getContext('2d');

        // Draw Background
        context.fillStyle = '#23272A';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Add stylish border
        context.strokeStyle = type === 'welcome' ? '#00b0f4' : '#f44336'; // Blue for welcome, Red for goodbye
        context.lineWidth = 10;
        context.strokeRect(0, 0, canvas.width, canvas.height);

        // Add Text
        context.font = '28px sans-serif';
        context.fillStyle = '#ffffff';
        context.fillText(type === 'welcome' ? 'Welcome to the server,' : 'Goodbye,', canvas.width / 2.5, canvas.height / 3.5);

        // Add Username
        context.font = 'apply-font-here 48px sans-serif';
        context.fillStyle = '#ffffff';
        let fontSize = 48;
        do {
            context.font = `${fontSize -= 2}px sans-serif`;
        } while (context.measureText(member.user.username).width > canvas.width - 300);
        context.fillText(member.user.username, canvas.width / 2.5, canvas.height / 1.8);

        // Add Member Count
        context.font = '24px sans-serif';
        context.fillStyle = '#aaaaaa';
        context.fillText(`Member #${member.guild.memberCount}`, canvas.width / 2.5, canvas.height / 1.3);

        // Avatar
        context.beginPath();
        context.arc(125, 125, 100, 0, Math.PI * 2, true);
        context.closePath();
        context.clip();

        try {
            const { body } = await request(member.user.displayAvatarURL({ extension: 'jpg' }));
            const avatar = await require('@napi-rs/canvas').loadImage(await body.arrayBuffer());
            context.drawImage(avatar, 25, 25, 200, 200);
        } catch (error) {
            console.error('Failed to load avatar:', error);
            // Fallback circle if avatar fails
            context.fillStyle = '#7289da';
            context.fill();
        }

        const buffer = await canvas.encode('png');
        return new AttachmentBuilder(buffer, { name: `${type}-image.png` });
    }
};
