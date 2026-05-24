
const { setUserRank, getUserRank, getRankLevel } = require('../lib/ranks');

async function setAdminCommand(sock, chatId, message, senderId) {
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
        
        // مالك or مدير can use this
        if (senderLevel < 3 && !message.key.fromMe) {
            await sock.sendMessage(chatId, { 
                text: '*↢ هـذا الامـر يخـص〖 المدير 〗*'
            }, { quoted: message });
            return;
        }
        
        let userToPromote;
        const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        
        if (mentionedJid && mentionedJid.length > 0) {
            userToPromote = mentionedJid[0];
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToPromote = message.message.extendedTextMessage.contextInfo.participant;
        } else {
            await sock.sendMessage(chatId, { text: '*↢ يرجى الرد على رسالة المستخدم أو عمل منشن له!*' }, { quoted: message });
            return;
        }
        
        // Set rank only (no WhatsApp promotion)
        await setUserRank(chatId, userToPromote, 'ادمن');
        
        // Set up action tracking (even though no WhatsApp promotion)
        if (!sock.recentManualActions) {
            sock.recentManualActions = new Map();
        }
        const actionKey = `${chatId}_${userToPromote}`;
        sock.recentManualActions.set(actionKey, Date.now());
        setTimeout(() => sock.recentManualActions.delete(actionKey), 3000);
        
        await sock.sendMessage(chatId, { 
            text: `*↢ ابشـر لاتهـون رفعـته ادمـن*\n*↢ الحلـو「 @${userToPromote.split('@')[0]} 」*`,
            mentions: [userToPromote]
        }, { quoted: message });
    } catch (error) {
        console.error('Error in setAdminCommand:', error);
        await sock.sendMessage(chatId, { text: '*↢ فشل في رفع المستخدم!*' }, { quoted: message });
    }
}

module.exports = setAdminCommand;
