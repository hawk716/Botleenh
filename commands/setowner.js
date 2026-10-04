const { UNDER_MAINTENANCE } = require('../lib/messages');

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
                    text: '*↢ عذراً الامر يخص〖 مالك〗فقط.*'
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

        // لا يمكن رفع البوت نفسه إلى رتبة مالك
        const groupMetaForBotCheck = await sock.groupMetadata(chatId);
        const { isTargetBot, rejectBotTarget } = require('../lib/isBotTarget');
        if (isTargetBot(sock, groupMetaForBotCheck, userToPromote)) {
            await rejectBotTarget(sock, chatId, message, { react: false });
            return;
        }

        // Set rank
        await setUserRank(chatId, userToPromote, 'مالك');
        // Promote to WhatsApp admin if not admin already
        const groupMetadata = await sock.groupMetadata(chatId);
        
        // Use the constant BOT_JID from our admin check system
    const { isBotAdminIn } = require('../lib/botAdminCheck');
        const isBotAdmin = isBotAdminIn(sock, groupMetadata);
        
        const targetWhatsApp = groupMetadata.participants.find(p => p.id === userToPromote);
        if (isBotAdmin && targetWhatsApp && !targetWhatsApp.admin) {
            try {
                await sock.groupParticipantsUpdate(chatId, [userToPromote], "promote");
            } catch(e) {
                console.error('[SETOWNER PROMOTE ERROR]', e);
            }
        } else if (!isBotAdmin) {
            console.log('[SETOWNER] Bot is not admin, skipping WhatsApp promotion');
        } else if (targetWhatsApp && targetWhatsApp.admin) {
            console.log('[SETOWNER] User already admin, skipping WhatsApp promotion');
        }
        await sock.sendMessage(chatId, { 
            text: `*↢ ابشـر لاتهـون رفعـته مالكـاً*\n*↢ الحلـو「 @${userToPromote.split('@')[0]} 」*`,
            mentions: [userToPromote]
        }, { quoted: message });
    } catch (error) {
        console.error('Error in setOwnerCommand:', error);
        await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE }, { quoted: message });
    }
}

module.exports = setOwnerCommand;
