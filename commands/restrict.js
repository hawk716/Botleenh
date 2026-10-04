const { UNDER_MAINTENANCE } = require('../lib/messages');

const { addRestriction, parseDuration, formatDate } = require('../lib/restrictions');
const { getUserRank, getRankLevel } = require('../lib/ranks');

async function restrictCommand(sock, chatId, message, senderId) {
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
        
        // ادمن or higher can use this
        if (senderLevel < 2 && !message.key.fromMe) {
            await sock.sendMessage(chatId, { 
                text: '*↢ هـذا الامـر يخـص〖 الادمن 〗*'
            }, { quoted: message });
            return;
        }
        
        let userToRestrict;
        const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        
        if (mentionedJid && mentionedJid.length > 0) {
            userToRestrict = mentionedJid[0];
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToRestrict = message.message.extendedTextMessage.contextInfo.participant;
        } else {
            await sock.sendMessage(chatId, { text: '*↢ يرجى الرد على رسالة المستخدم أو عمل منشن له!*' }, { quoted: message });
            return;
        }
        
        // لا يمكن تقييد البوت نفسه
        const { isTargetBot, rejectBotTarget } = require('../lib/isBotTarget');
        if (isTargetBot(sock, groupMetadata, userToRestrict)) {
            await rejectBotTarget(sock, chatId, message);
            return;
        }

        // Check if target has higher rank
        const targetRank = await getUserRank(chatId, userToRestrict);
        const targetLevel = getRankLevel(targetRank);
        
        if (targetLevel >= senderLevel && !message.key.fromMe) {
            await sock.sendMessage(chatId, { 
                text: '*↢ لا يمكنك تقييد شخص برتبة أعلى أو مساوية لك!*'
            }, { quoted: message });
            return;
        }
        
        // Parse duration
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const durationMatch = text.match(/(\d+\s*(سنة|سنوات|شهر|اشهر|ساعة|ساعات|دقيقة|دقائق|ثانية|ثواني))/);
        
        let expiresAt = null;
        let responseText = `*↢ مقيـد بسـبب مشاكـلك「 @${userToRestrict.split('@')[0]} 」*`;
        
        if (durationMatch) {
            expiresAt = parseDuration(durationMatch[0]);
            if (expiresAt) {
                responseText += `\n*↢ الى: ${formatDate(expiresAt)}*`;
            }
        }
        
        await addRestriction(chatId, userToRestrict, expiresAt);
        
        await sock.sendMessage(chatId, { 
            text: responseText,
            mentions: [userToRestrict]
        }, { quoted: message });
    } catch (error) {
        console.error('Error in restrictCommand:', error);
        await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE }, { quoted: message });
    }
}

module.exports = restrictCommand;
