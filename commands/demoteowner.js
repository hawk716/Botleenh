const { UNDER_MAINTENANCE } = require('../lib/messages');

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
        
        let senderLevel = 5;
        if (!isBotSender) {
            const groupMetadata = await sock.groupMetadata(chatId);
            
            // Check if sender is a WhatsApp admin
            const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
            const isWhatsAppAdmin = senderParticipant && senderParticipant.admin;
            
            const senderRank = await getUserRank(chatId, senderId, isWhatsAppAdmin);
            senderLevel = getRankLevel(senderRank);
            
            // Allow مالك أساسي or مالك to demote مالك
            if (senderLevel < 4) {
                await sock.sendMessage(chatId, { 
                    text: '*↢ هـذا الامـر يخـص〖 مالك〗فقط.*'
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
        
        // Check if bot is admin before proceeding
        const groupMetadata = await sock.groupMetadata(chatId);
    const { isBotAdminIn } = require('../lib/botAdminCheck');
        const isBotAdmin = isBotAdminIn(sock, groupMetadata);
        
        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { text: '*↢عذراً لا استطيع اداره المجموعه وانا لست مشرفاً، قم بتعييني كمشرف أولاً.*' }, { quoted: message });
            return;
        }
        
        const ownerJid = groupMetadata.owner;
        const targetParticipant = groupMetadata.participants.find(p => p.id === userToDemote);
        const isTargetWhatsAppAdmin = targetParticipant && targetParticipant.admin;
        const isTargetOwner = !!ownerJid && userToDemote === ownerJid;
        
        const targetRank = await getUserRank(chatId, userToDemote);
        // لا يمكن تنزيل البوت نفسه
        const { isTargetBot, rejectBotTarget } = require('../lib/isBotTarget');
        if (isTargetBot(sock, groupMetadata, userToDemote)) {
            await rejectBotTarget(sock, chatId, message, { react: false });
            return;
        }

        const {isPrimaryOwner}=require('../lib/primaryOwner');
        const targetIsPrimary = isPrimaryOwner(chatId, userToDemote);

        if (targetIsPrimary) {
            await sock.sendMessage(chatId, { text: '*↢ لا يمكنك تنزيل〖 مالك الاساسي 〗*' }, { quoted: message });
            return;
        }

        if (!isBotSender && senderLevel === 4 && targetRank === 'مالك') {
            await sock.sendMessage(chatId, {
                text: '*↢ عـذراً الامـر يـخص  ↤︎〖  المـالك الاسـاسـي 〗فـقط .*'
            }, { quoted: message });
            return;
        }
        
        if (targetRank !== 'مالك' && !isTargetWhatsAppAdmin) {
            await sock.sendMessage(chatId, { 
                text: '*↢ عذراً المستخدم ليس مالك.*'
            }, { quoted: message });
            return;
        }
        
        // Demote in WhatsApp if they are a regular admin (not group owner — can't demote owner via API)
        if (isTargetWhatsAppAdmin && !isTargetOwner) {
            try {
                await sock.groupParticipantsUpdate(chatId, [userToDemote], "demote");
            } catch(e) {
                console.error('[DEMOTEOWNER DEMOTE ERROR]', e);
            }
        } else if (isTargetOwner) {
            await sock.sendMessage(chatId, { text: '*↢ لا يمكنك تنزيل منشئ المجموعة*' }, { quoted: message });
            return;
        }
        
        // Remove rank if they have one
        if (targetRank !== 'عضو') {
            await removeUserRank(chatId, userToDemote);
        }
        // Demote from WhatsApp admin regardless of current admin state (unless group owner/primary owner already prevented)
        const groupMetadata2 = groupMetadata;
        const targetWhatsApp2 = groupMetadata2.participants.find(p => p.id === userToDemote);
        if (targetWhatsApp2 && targetWhatsApp2.admin) {
            try {
                await sock.groupParticipantsUpdate(chatId, [userToDemote], "demote");
            } catch(e) {
                console.error('[DEMOTEOWNER DEMOTE ERROR]', e);
            }
        }
        await sock.sendMessage(chatId, { 
            text: `*↢ الطيـب「 @${userToDemote.split('@')[0]} 」*\n*↢ تم تنزيله من المالك*`,
            mentions: [userToDemote]
        }, { quoted: message });
    } catch (error) {
        console.error('Error in demoteOwnerCommand:', error);
        await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE });
    }
}

module.exports = demoteOwnerCommand;
