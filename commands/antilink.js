const { bots } = require('../lib/antilink');
const { setAntilink, getAntilink, removeAntilink } = require('../lib/index');
const { getUserRank, getRankLevel } = require('../lib/ranks');

async function handleAntilinkCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
        const isWhatsAppAdmin = senderParticipant && senderParticipant.admin;
        const senderRank = await getUserRank(chatId, senderId, isWhatsAppAdmin);
        const senderLevel = getRankLevel(senderRank);

        // مدير or higher (level >= 3) can use this
        if (senderLevel < 3 && !message.key.fromMe) {
            await sock.sendMessage(chatId, { text: '*↢ هـذا الامـر يخـص〖 مدير 〗*' }, { quoted: message });
            return;
        }

        const username = `@${senderId.split('@')[0]}`;
        
        // معالجة الأوامر العربية مباشرة
        if (userMessage === 'فتح الروابط') {
            const existingConfig = await getAntilink(chatId, 'on');
            if (existingConfig?.enabled) {
                await removeAntilink(chatId, 'on');
            }
            await setAntilink(chatId, 'on', 'delete');
            await sock.sendMessage(chatId, { 
                text: `*↢ ال${senderRank} 「 ${username} 」*\n*↢ تم فتح الروابـط*`,
                mentions: [senderId]
            }, { quoted: message });
            return;
        }

        if (userMessage === 'قفل الروابط') {
            await removeAntilink(chatId, 'on');
            await sock.sendMessage(chatId, { 
                text: `*↢ ال${senderRank} 「 ${username} 」*\n*↢ تم قفل الروابـط*`,
                mentions: [senderId]
            }, { quoted: message });
            return;
        }

        if (userMessage.startsWith('إعدادات الروابط')) {
            const parts = userMessage.split(' ');
            if (parts.length < 3) {
                await sock.sendMessage(chatId, { 
                    text: `*_يرجى تحديد إجراء: إعدادات الروابط delete | kick | warn_*` 
                }, { quoted: message });
                return;
            }
            const setAction = parts[2];
            if (!['delete', 'kick', 'warn'].includes(setAction)) {
                await sock.sendMessage(chatId, { 
                    text: '*_إجراء غير صالح. اختر delete أو kick أو warn._*' 
                }, { quoted: message });
                return;
            }
            await setAntilink(chatId, 'on', setAction);
            await sock.sendMessage(chatId, { 
                text: `*_تم تعيين إجراء مكافحة الروابط إلى ${setAction}_*`
            }, { quoted: message });
            return;
        }

    } catch (error) {
        console.error('Error in antilink command:', error);
        await sock.sendMessage(chatId, { text: '*_خطأ في معالجة أمر مكافحة الروابط_*' });
    }
}

async function handleLinkDetection(sock, chatId, message, userMessage, senderId) {
    try {
        const { getAntilink } = require('../lib/index');
        const antilinkSetting = await getAntilink(chatId, 'on');
        
        if (!antilinkSetting || !antilinkSetting.enabled) return;

        const linkPatterns = /https?:\/\/\S+|www\.\S+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?/i;

        if (linkPatterns.test(userMessage)) {
            const quotedMessageId = message.key.id;
            const quotedParticipant = message.key.participant || senderId;

            try {
                await sock.sendMessage(chatId, {
                    delete: { remoteJid: chatId, fromMe: false, id: quotedMessageId, participant: quotedParticipant },
                });
            } catch (error) {
                console.error('Failed to delete message:', error);
            }
        }
    } catch (error) {
        console.error('Error in link detection:', error);
    }
}

module.exports = {
    handleAntilinkCommand,
    handleLinkDetection,
};
