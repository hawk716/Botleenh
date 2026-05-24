
const { removeRestriction } = require('../lib/restrictions');
const { getUserRank, getRankLevel } = require('../lib/ranks');
const { resetViolations, resetTagViolations } = require('../lib/antilink');

async function unrestrictCommand(sock, chatId, message, senderId) {
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
        
        let userToUnrestrict;
        const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        
        if (mentionedJid && mentionedJid.length > 0) {
            userToUnrestrict = mentionedJid[0];
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToUnrestrict = message.message.extendedTextMessage.contextInfo.participant;
        } else {
            // Try to extract user ID from command text
            const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
            const cleanedText = text.replace(/الغاء التقييد|الغاء التقيد|الغاء_التقييد|الغاء_التقيد/gi, '').trim();
            if (cleanedText) {
                // Check if it looks like a JID (contains @)
                if (cleanedText.includes('@')) {
                    userToUnrestrict = cleanedText.replace(/\s/g, '');
                } else {
                    // Assume it's a phone number, construct JID
                    const number = cleanedText.replace(/[^0-9]/g, '');
                    if (number) {
                        userToUnrestrict = `${number}@s.whatsapp.net`;
                    }
                }
            }
        }
        
        if (!userToUnrestrict) {
            await sock.sendMessage(chatId, { text: '*↢ يرجى الرد على رسالة المستخدم أو عمل منشن له أو إرسال ايدي المستخدم!*' }, { quoted: message });
            return;
        }
        
        await removeRestriction(chatId, userToUnrestrict);
        resetViolations(chatId, userToUnrestrict);
        resetTagViolations(chatId, userToUnrestrict);
        
        await sock.sendMessage(chatId, { 
            text: `*↢ المستخـدم「 @${userToUnrestrict.split('@')[0]} 」*\n*↢ تـم الغاء تقـيده*`,
            mentions: [userToUnrestrict]
        }, { quoted: message });
    } catch (error) {
        console.error('Error in unrestrictCommand:', error);
        await sock.sendMessage(chatId, { text: '*↢ فشل في إلغاء التقييد!*' }, { quoted: message });
    }
}

module.exports = unrestrictCommand;
