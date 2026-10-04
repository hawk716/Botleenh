const { UNDER_MAINTENANCE } = require('../lib/messages');

const { removeUserRank, getUserRank, getRankLevel } = require('../lib/ranks');

async function demoteAdminCommand(sock, chatId, message, senderId) {
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
        
        // مدير or higher can demote ادمن
        if (senderLevel < 2 && !message.key.fromMe) {
            await sock.sendMessage(chatId, { 
                text: '*↢ هـذا الامـر يخـص〖 الادمن 〗 فما فوق*'
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
        

        // لا يمكن تنزيل البوت نفسه
        const { isTargetBot, rejectBotTarget } = require('../lib/isBotTarget');
        if (isTargetBot(sock, groupMetadata, userToDemote)) {
            await rejectBotTarget(sock, chatId, message, { react: false });
            return;
        }

        // Check if user is actually ادمن
        const targetRank = await getUserRank(chatId, userToDemote);
        if (targetRank !== 'ادمن') {
            await sock.sendMessage(chatId, { 
                text: '*↢ عذراً المستخدم ليس ادمن.*'
            }, { quoted: message });
            return;
        }
        
        // Remove rank (no WhatsApp demotion for ادمن)
        await removeUserRank(chatId, userToDemote);
        
        await sock.sendMessage(chatId, { 
            text: `*↢ تم تنزيله من رتبة ادمن*\n*↢ المستخدم「 @${userToDemote.split('@')[0]} 」*`,
            mentions: [userToDemote]
        }, { quoted: message });
    } catch (error) {
        console.error('Error in demoteAdminCommand:', error);
        await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE }, { quoted: message });
    }
}

module.exports = demoteAdminCommand;
