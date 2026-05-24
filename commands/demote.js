
const { getUserRank, getRankLevel, removeUserRank } = require('../lib/ranks');

async function demoteCommand(sock, chatId, mentionedJids, message, senderId, specifiedRank = null) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { 
                text: '*↢ هذا الأمر يمكن استخدامه في المجموعات فقط!*'
            }, { quoted: message });
            return;
        }

        // Permission check - level 4 (مالك) only
        const groupMetadata = await sock.groupMetadata(chatId);
        const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
        const isWhatsAppAdmin = senderParticipant && senderParticipant.admin;
        const senderRank = await getUserRank(chatId, senderId, isWhatsAppAdmin);
        const senderLevel = getRankLevel(senderRank);

        if (senderLevel < 4 && !message.key.fromMe) {
            await sock.sendMessage(chatId, { 
                text: '*↢ عذراً الامر يخص〖 المالك〗فقط.*'
            }, { quoted: message });
            return;
        }

        let userToDemote = [];
        
        if (mentionedJids && mentionedJids.length > 0) {
            userToDemote = mentionedJids;
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToDemote = [message.message.extendedTextMessage.contextInfo.participant];
        }
        
        if (userToDemote.length === 0) {
            await sock.sendMessage(chatId, { 
                text: '*↢ يرجى عمل منشن للمستخدم أو الرد على رسالته لتخفيضه!*'
            }, { quoted: message });
            return;
        }

        if (!sock.recentManualActions) {
            sock.recentManualActions = new Map();
        }
        
        const actionKey = `${chatId}_${userToDemote.join('_')}`;
        sock.recentManualActions.set(actionKey, Date.now());
        setTimeout(() => sock.recentManualActions.delete(actionKey), 3000);
        
        const usernames = userToDemote.map(jid => `@${jid.split('@')[0]}`);
        const targetParticipant = groupMetadata.participants.find(p => p.id === userToDemote[0]);
        const isTargetWhatsAppAdmin = targetParticipant && targetParticipant.admin;
        const currentRank = await getUserRank(chatId, userToDemote[0], isTargetWhatsAppAdmin);
        
        if (specifiedRank) {
            const rankMap = {
                'مالك': 'مالك',
                'مدير': 'مدير',
                'ادمن': 'ادمن',
                'مميز': 'مميز'
            };
            
            const targetRank = rankMap[specifiedRank];
            
            if (currentRank !== targetRank) {
                await sock.sendMessage(chatId, { 
                    text: `*↢ الطيـب「 ${usernames.join(', ')} 」*\n*↢ بالاصل ليس ${targetRank}*`,
                    mentions: userToDemote
                }, { quoted: message });
                return;
            }
        }
        
        // Only remove rank - don't call groupParticipantsUpdate
        await removeUserRank(chatId, userToDemote[0]);
        
        const demotionMessage = `*↢ الطيـب「 ${usernames.join(', ')} 」*\n*↢ تم تنزيله من ${currentRank}*`;
        
        await sock.sendMessage(chatId, { 
            text: demotionMessage,
            mentions: userToDemote
        }, { quoted: message });
    } catch (error) {
        console.error('Error in demote command:', error);
        await sock.sendMessage(chatId, { 
            text: '*↢ فشل عملية التخفيض. تأكد من أن البوت مشرف وله الصلاحيات الكافية.*'
        }, { quoted: message });
    }
}

async function handleDemotionEvent(sock, groupId, participants, author) {
    try {
        const actionKey = `${groupId}_${participants.join('_')}`;
        if (sock.recentManualActions && sock.recentManualActions.has(actionKey)) {
            return;
        }

        if (!groupId || !participants) {
            console.log('Invalid groupId or participants:', { groupId, participants });
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        const demotedUsernames = await Promise.all(participants.map(async jid => {
            return `@${jid.split('@')[0]}`;
        }));

        let mentionList = [...participants];

        if (author && author.length > 0) {
            const authorJid = author;
            mentionList.push(authorJid);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        const demotionMessage = `*↢ الطيـب「 ${demotedUsernames.join(', ')} 」*\n*↢ تم تنزيله من مالك*`;
        
        await sock.sendMessage(groupId, {
            text: demotionMessage,
            mentions: participants
        });
    } catch (error) {
        console.error('Error handling demotion event:', error);
        if (error.data === 429) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

module.exports = { demoteCommand, handleDemotionEvent };
