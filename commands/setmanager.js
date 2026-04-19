const { setUserRank, getUserRank, getRankLevel } = require('../lib/ranks');

async function setManagerCommand(sock, chatId, message, senderId) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: '❌ هذا الأمر يمكن استخدامه في المجموعات فقط!' });
            return;
        }
        
        const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotSender = senderId === botJid || message.key.fromMe;
        
        if (!isBotSender) {
            const groupMetadata = await sock.groupMetadata(chatId);
            const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
            const isWhatsAppAdmin = senderParticipant && senderParticipant.admin;
            const senderRank = await getUserRank(chatId, senderId, isWhatsAppAdmin);
            const senderLevel = getRankLevel(senderRank);
            
            if (senderLevel < 4) {
                await sock.sendMessage(chatId, { 
                    text: '*↢ هـذا الامـر يخـص〖 المالك 〗*'
                }, { quoted: message });
                return;
            }
        }
        
        let userToPromote;
        const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        
        if (mentionedJid && mentionedJid.length > 0) {
            userToPromote = mentionedJid[0];
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToPromote = message.message.extendedTextMessage.contextInfo.participant;
        } else {
            await sock.sendMessage(chatId, { text: '❌ يرجى الرد على رسالة المستخدم أو عمل منشن له!' }, { quoted: message });
            return;
        }
        
        if (!sock.recentManualActions) {
            sock.recentManualActions = new Map();
        }
        const actionKey = `${chatId}_${userToPromote}`;
        sock.recentManualActions.set(actionKey, Date.now());
        setTimeout(() => sock.recentManualActions.delete(actionKey), 3000);
        
        await setUserRank(chatId, userToPromote, 'مدير');
        
        await sock.sendMessage(chatId, { 
            text: `*↫ ابشـر لاتهـون رفعـته مـدير*\n*↫ الحلـو「 @${userToPromote.split('@')[0]} 」*`,
            mentions: [userToPromote]
        }, { quoted: message });
    } catch (error) {
        console.error('Error in setManagerCommand:', error);
        await sock.sendMessage(chatId, { text: '❌ فشل في رفع المستخدم!' });
    }
}

module.exports = setManagerCommand;
