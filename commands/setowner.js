
const { setUserRank, getUserRank, getRankLevel } = require('../lib/ranks');

async function setOwnerCommand(sock, chatId, message, senderId) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: '*↢ هذا الأمر يمكن استخدامه في المجموعات فقط!*' }, { quoted: message });
            return;
        }
        
        // Check if sender is bot or has required level
        const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotSender = senderId === botJid || message.key.fromMe;
        
        if (!isBotSender) {
            const groupMetadata = await sock.groupMetadata(chatId);
            
            // Check if sender is a WhatsApp admin
            const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
            const isWhatsAppAdmin = senderParticipant && senderParticipant.admin;
            
            const senderRank = await getUserRank(chatId, senderId, isWhatsAppAdmin);
            const senderLevel = getRankLevel(senderRank);
            
            // Only مالك (level 4) can set owner
            if (senderLevel < 4) {
                await sock.sendMessage(chatId, { 
                    text: '*↢ عذراً الامر يخص〖 المالك〗فقط.*'
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
            await sock.sendMessage(chatId, { text: '*↢ يرجى الرد على رسالة المستخدم أو عمل منشن له!*' }, { quoted: message });
            return;
        }
        
        // Set up action tracking to prevent duplicate messages from handlePromotionEvent
        if (!sock.recentManualActions) {
            sock.recentManualActions = new Map();
        }
        const actionKey = `${chatId}_${userToPromote}`;
        sock.recentManualActions.set(actionKey, Date.now());
        setTimeout(() => sock.recentManualActions.delete(actionKey), 3000);

        // Only set rank - don't promote in WhatsApp
        await setUserRank(chatId, userToPromote, 'مالك');
        
        await sock.sendMessage(chatId, { 
            text: `*↢ ابشـر لاتهـون رفعـته مالـك*\n*↢ الحلـو「 @${userToPromote.split('@')[0]} 」*`,
            mentions: [userToPromote]
        }, { quoted: message });
    } catch (error) {
        console.error('Error in setOwnerCommand:', error);
        await sock.sendMessage(chatId, { text: '*↢ فشل في رفع المستخدم!*' }, { quoted: message });
    }
}

module.exports = setOwnerCommand;
