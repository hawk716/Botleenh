
const { removeRestriction } = require('../lib/restrictions');
const { getUserRank, getRankLevel } = require('../lib/ranks');

async function unrestrictCommand(sock, chatId, message, senderId) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: '❌ هذا الأمر يمكن استخدامه في المجموعات فقط!' });
            return;
        }
        
        const groupMetadata = await sock.groupMetadata(chatId);
        const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
        const isWhatsAppAdmin = senderParticipant && senderParticipant.admin;
        const senderRank = await getUserRank(chatId, senderId, isWhatsAppAdmin);
        const senderLevel = getRankLevel(senderRank);
        
        // ادمن or higher can use this
        if (senderLevel < 2 && !message.key.fromMe) {
            await sock.sendMessage(chatId, { 
                text: '*↢ هـذا الامـر يخـص〖 الادمن 〗*'
            }, { quoted: message });
            return;
        }
        
        let userToUnrestrict;
        const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        
        if (mentionedJid && mentionedJid.length > 0) {
            userToUnrestrict = mentionedJid[0];
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToUnrestrict = message.message.extendedTextMessage.contextInfo.participant;
        } else {
            await sock.sendMessage(chatId, { text: '❌ يرجى الرد على رسالة المستخدم أو عمل منشن له!' }, { quoted: message });
            return;
        }
        
        await removeRestriction(chatId, userToUnrestrict);
        
        await sock.sendMessage(chatId, { 
            text: `*↢ تـم الغاء تقـيده*\n*↢ المستخـدم @${userToUnrestrict.split('@')[0]}*`,
            mentions: [userToUnrestrict]
        }, { quoted: message });
    } catch (error) {
        console.error('Error in unrestrictCommand:', error);
        await sock.sendMessage(chatId, { text: '❌ فشل في إلغاء التقييد!' });
    }
}

module.exports = unrestrictCommand;
