const { UNDER_MAINTENANCE } = require('../lib/messages');
const { setAntilink, removeAntilink } = require('../lib/index');
const { getUserRank, getRankLevel } = require('../lib/ranks');
const { clearConfigCache } = require('../lib/antilink');

async function handleAntilinkCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
        const isWhatsAppAdmin = senderParticipant && senderParticipant.admin;
        const senderRank = await getUserRank(chatId, senderId, isWhatsAppAdmin);
        const senderLevel = getRankLevel(senderRank);

        if (senderLevel < 2 && !message.key.fromMe) {
            await sock.sendMessage(chatId, { text: '*↢ هـذا الامـر يخـص〖 مدير 〗*' }, { quoted: message });
            return;
        }

        const username = `@${senderId.split('@')[0]}`;

        if (userMessage === 'قفل الروابط') {
            await setAntilink(chatId, 'on', 'delete');
            clearConfigCache(chatId);
            await sock.sendMessage(chatId, {
                text: `*↢ ال${senderRank} 「 ${username} 」*\n*↢ تم قفـل الروابـط*`,
                mentions: [senderId]
            }, { quoted: message });
            return;
        }

        if (userMessage === 'فتح الروابط') {
            await removeAntilink(chatId, 'on');
            clearConfigCache(chatId);
            await sock.sendMessage(chatId, {
                text: `*↢ ال${senderRank} 「 ${username} 」*\n*↢ تم فتـح الروابـط*`,
                mentions: [senderId]
            }, { quoted: message });
            return;
        }
    } catch (error) {
        console.error('Error in antilink command:', error);
        await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE });
    }
}

module.exports = {
    handleAntilinkCommand,
};
