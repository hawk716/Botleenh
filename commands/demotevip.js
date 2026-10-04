const { UNDER_MAINTENANCE } = require('../lib/messages');

const { removeUserRank, getUserRank, getRankLevel } = require('../lib/ranks');

async function demoteVipCommand(sock, chatId, message, senderId) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: '*↢ هذا الأمر يمكن استخدامه في المجموعات فقط!*' }, { quoted: message });
            return;
        }
        
        const groupMetadata = await sock.groupMetadata(chatId);
        const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
        const isWhatsAppAdmin = senderParticipant && senderParticipant.admin;
        const senderRank = await getUserRank(chatId, senderId, isWhatsAppAdmin);
        const senderLevel = getRankLevel(senderRank);
        
        // مدير or higher can demote مميز
        if (senderLevel < 3 && !message.key.fromMe) {
            await sock.sendMessage(chatId, { 
                text: '*↢ هـذا الامـر يخـص〖 مدير 〗*'
            }, { quoted: message });
            return;
        }
        
        let userToDemote;
        const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        
        if (mentionedJid && mentionedJid.length > 0) {
            userToDemote = mentionedJid[0];
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToDemote = message.message.extendedTextMessage.contextInfo.participant;
        } else {
            await sock.sendMessage(chatId, { text: '*↢ يرجى الرد على رسالة المستخدم أو عمل منشن له!*' }, { quoted: message });
            return;
        }
        
        // Check if user is actually مميز

        // لا يمكن تنزيل البوت نفسه
        const { isTargetBot, rejectBotTarget } = require('../lib/isBotTarget');
        if (isTargetBot(sock, groupMetadata, userToDemote)) {
            await rejectBotTarget(sock, chatId, message, { react: false });
            return;
        }

        const targetRank = await getUserRank(chatId, userToDemote);
        if (targetRank !== 'مميز') {
            await sock.sendMessage(chatId, { 
                text: '*↢ عذراً المستخدم ليس مميز.*'
            }, { quoted: message });
            return;
        }
        
        // Remove rank
        await removeUserRank(chatId, userToDemote);
        
        await sock.sendMessage(chatId, { 
            text: `*↢ تم تنزيله من رتبة مميز*\n*↢ المستخدم「 @${userToDemote.split('@')[0]} 」*`,
            mentions: [userToDemote]
        }, { quoted: message });
    } catch (error) {
        console.error('Error in demoteVipCommand:', error);
        await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE }, { quoted: message });
    }
}

module.exports = demoteVipCommand;
