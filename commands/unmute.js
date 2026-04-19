const { getUserRank } = require('../lib/ranks');

async function unmuteCommand(sock, chatId, senderId) {
    await sock.groupSettingUpdate(chatId, 'not_announcement');
    
    const groupMetadata = await sock.groupMetadata(chatId);
    const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
    const isWhatsAppAdmin = senderParticipant && senderParticipant.admin;
    const senderRank = await getUserRank(chatId, senderId, isWhatsAppAdmin);
    const username = `@${senderId.split('@')[0]}`;
    
    await sock.sendMessage(chatId, { 
        text: `*↢ ال${senderRank} 「 ${username} 」*\n*↢ تم فتح القـروب*`,
        mentions: [senderId]
    });
}

module.exports = unmuteCommand;
