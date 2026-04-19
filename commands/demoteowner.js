
const { removeUserRank, getUserRank, getRankLevel } = require('../lib/ranks');

async function demoteOwnerCommand(sock, chatId, message, senderId) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: '❌ هذا الأمر يمكن استخدامه في المجموعات فقط!' });
            return;
        }
        
        // Check if sender is bot or group owner
        const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const isBotSender = senderId === botJid || message.key.fromMe;
        
        if (!isBotSender) {
            const groupMetadata = await sock.groupMetadata(chatId);
            
            // Check if sender is a WhatsApp admin
            const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
            const isWhatsAppAdmin = senderParticipant && senderParticipant.admin;
            
            const senderRank = await getUserRank(chatId, senderId, isWhatsAppAdmin);
            const senderLevel = getRankLevel(senderRank);
            
            // Allow مالك to demote مالك
            if (senderLevel < 4) {
                await sock.sendMessage(chatId, { 
                    text: '*↢ هـذا الامـر يخـص〖 المشرفين 〗*'
                }, { quoted: message });
                return;
            }
        }
        
        let userToDemote;
        const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        
        if (mentionedJid && mentionedJid.length > 0) {
            userToDemote = mentionedJid[0];
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToDemote = message.message.extendedTextMessage.contextInfo.participant;
        } else {
            await sock.sendMessage(chatId, { text: '❌ يرجى الرد على رسالة المستخدم أو عمل منشن له!' }, { quoted: message });
            return;
        }
        
        // Check if user is either مالك in bot or WhatsApp admin
        const groupMetadata = await sock.groupMetadata(chatId);
        const targetParticipant = groupMetadata.participants.find(p => p.id === userToDemote);
        const isTargetWhatsAppAdmin = targetParticipant && targetParticipant.admin;
        
        const targetRank = await getUserRank(chatId, userToDemote);
        
        if (targetRank !== 'مالك' && !isTargetWhatsAppAdmin) {
            await sock.sendMessage(chatId, { 
                text: '*↢ عذراً المستخدم ليس مالك.*'
            }, { quoted: message });
            return;
        }
        
        // Demote in WhatsApp if they are admin
        if (isTargetWhatsAppAdmin) {
            await sock.groupParticipantsUpdate(chatId, [userToDemote], "demote");
        }
        
        // Remove rank if they have one
        if (targetRank !== 'عضو') {
            await removeUserRank(chatId, userToDemote);
        }
        
        await sock.sendMessage(chatId, { 
            text: `*↢ الطيـب「 @${userToDemote.split('@')[0]} 」*\n*↢ تم تنزيله من المالك*`,
            mentions: [userToDemote]
        }, { quoted: message });
    } catch (error) {
        console.error('Error in demoteOwnerCommand:', error);
        await sock.sendMessage(chatId, { text: '❌ فشل في تنزيل المستخدم!' });
    }
}

module.exports = demoteOwnerCommand;
