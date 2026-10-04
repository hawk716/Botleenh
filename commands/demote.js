
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
        
        const usernames = userToDemote.map(jid => { const j = typeof jid==='string'?jid:(jid&&jid.id?jid.id:String(jid)); return `@${j.split('@')[0]}`; });
        const targetParticipant = groupMetadata.participants.find(p => p.id === userToDemote[0]);
        const isTargetWhatsAppAdmin = targetParticipant && targetParticipant.admin;
        const currentRank = await getUserRank(chatId, userToDemote[0], isTargetWhatsAppAdmin);


        // لا يمكن تنزيل البوت نفسه
        const { isTargetBot, rejectBotTarget } = require('../lib/isBotTarget');
        if (isTargetBot(sock, groupMetadata, userToDemote[0])) {
            await rejectBotTarget(sock, chatId, message, { react: false });
            return;
        }

        if (!message.key.fromMe && senderLevel === 4 && currentRank === 'مالك') {
            await sock.sendMessage(chatId, {
                text: '*↢ عـذراً الامـر يـخص  ↤︎〖  المـالك الاسـاسـي 〗فـقط .*'
            }, { quoted: message });
            return;
        }

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
        const norm = (a) => { const s = typeof a === "string" ? a : (a && (a.id || a.jid || a.phoneNumber) ? (a.id || a.jid || a.phoneNumber) : String(a)); return s.split('@')[0].split(':')[0]; };
        const botIdNum = sock.user?.id?.split(':')[0]?.split('@')[0] || '';
        const botDemoted = participants.some(p => {
            if (typeof p === 'string') return p.split('@')[0].split(':')[0] === botIdNum;
            const idNorm = (p.id || p.jid || '').split('@')[0].split(':')[0];
            const phoneNorm = (p.phoneNumber || '').split('@')[0].split(':')[0];
            return idNorm === botIdNum || phoneNorm === botIdNum;
        });
        if (botDemoted) return; // البوت تنزل — يتجاهل

        const participantsStr = participants.map(norm);
        const actionKey = `${groupId}_${participantsStr.join('_')}`;
        if (sock.recentManualActions && sock.recentManualActions.has(actionKey)) {
            return;
        }

        if (!groupId || !participants) {
            console.log('Invalid groupId or participants:', { groupId, participants });
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        const groupMeta = await sock.groupMetadata(groupId).catch(() => null);
        const demotedUsernames = await Promise.all(participants.map(async jid => {
            const jidStr = typeof jid === 'string' ? jid : (jid && jid.id ? jid.id : String(jid));
            const participant = groupMeta?.participants?.find(p => p.id === jidStr);
            const name = participant?.name || sock.contacts?.get?.(jidStr)?.name || jidStr.split('@')[0];
            return `@${name}`;
        }));

        let mentionList = [...participantsStr];

        if (author && author.length > 0) {
            const authorJid = typeof author === 'string' ? author : (author && author.id ? author.id : String(author));
            mentionList.push(authorJid);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        const demotionMessage = `*↢ الطيـب「 ${demotedUsernames.join(', ')} 」*\n*↢ تم تنزيله من مالك*`;
        
        await sock.sendMessage(groupId, {
            text: demotionMessage,
            mentions: mentionList
        });
    } catch (error) {
        console.error('Error handling demotion event:', error);
        if (error.data === 429) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

module.exports = { demoteCommand, handleDemotionEvent };
