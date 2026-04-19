
const { removeUserRank, getUserRank, getRankLevel } = require('../lib/ranks');

async function demoteManagerCommand(sock, chatId, message, senderId) {
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
            
            // مالك or مدير can demote مدير
            if (senderLevel < 3) {
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
        
        // Check if user is actually مدير
        const targetRank = await getUserRank(chatId, userToDemote);
        if (targetRank !== 'مدير') {
            await sock.sendMessage(chatId, { 
                text: '*↢ عذراً المستخدم ليس مدير.*'
            }, { quoted: message });
            return;
        }
        
        // Demote in WhatsApp
        await sock.groupParticipantsUpdate(chatId, [userToDemote], "demote");
        
        // Remove rank
        await removeUserRank(chatId, userToDemote);
        
        await sock.sendMessage(chatId, { 
            text: `*↫ تم تنزيله من رتبة مدير*\n*↫ المستخدم「 @${userToDemote.split('@')[0]} 」*`,
            mentions: [userToDemote]
        }, { quoted: message });
    } catch (error) {
        console.error('Error in demoteManagerCommand:', error);
        await sock.sendMessage(chatId, { text: '❌ فشل في تنزيل المستخدم!' });
    }
}

module.exports = demoteManagerCommand;
