const isAdmin = require('../lib/isAdmin');  // Move isAdmin to helpers

async function tagAllCommand(sock, chatId, senderId) {
    try {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
        
        if (!isSenderAdmin && !isBotAdmin) {
            await sock.sendMessage(chatId, {
                text: '• عذراً الامر يخص ↤︎ 〖  الادمن 〗 فقط .'
            });
            return;
        }

        // Get group metadata
        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants;

        if (!participants || participants.length === 0) {
            await sock.sendMessage(chatId, { text: 'لم يتم العثور على أعضاء في المجموعة.' });
            return;
        }

        // Create message with numbered list
        let message = '⇜ وين الطيبين؟\n༺═────────────═༻\n';
        participants.forEach((participant, index) => {
            message += `${index + 1} ⁃ @${participant.id.split('@')[0]}\n`;
        });

        // Send message with mentions
        await sock.sendMessage(chatId, {
            text: message,
            mentions: participants.map(p => p.id)
        });

    } catch (error) {
        console.error('Error in tagall command:', error);
        await sock.sendMessage(chatId, { text: 'فشل عمل منشن لجميع الأعضاء.' });
    }
}

module.exports = tagAllCommand;  // Export directly
