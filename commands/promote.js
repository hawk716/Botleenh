const { UNDER_MAINTENANCE } = require('../lib/messages');

const { getUserRank, getRankLevel } = require('../lib/ranks');
const { setUserRank } = require('../lib/ranks');

async function promoteCommand(sock, chatId, mentionedJids, message, senderId) {
    let userToPromote = [];
    
    if (mentionedJids && mentionedJids.length > 0) {
        userToPromote = mentionedJids;
    }
    else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToPromote = [message.message.extendedTextMessage.contextInfo.participant];
    }
    
    if (userToPromote.length === 0) {
        await sock.sendMessage(chatId, { 
            text: '*↢ يرجى عمل منشن للمستخدم أو الرد على رسالته لترقيته!*'
        }, { quoted: message });
        return;
    }

    // Permission check - level 4 (مالك) only
    const groupMetadata = await sock.groupMetadata(chatId);
    const { isBotAdminIn } = require('../lib/botAdminCheck');
        const isBotAdmin = isBotAdminIn(sock, groupMetadata);
    
    if (!isBotAdmin) {
        await sock.sendMessage(chatId, { text: '*↢عذراً لا استطيع اداره المجموعه وانا لست مشرفاً، قم بتعييني كمشرف أولاً.*' }, { quoted: message });
        return;
    }
    
    const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
    const isWhatsAppAdmin = senderParticipant && senderParticipant.admin;
    const senderRank = await getUserRank(chatId, senderId, isWhatsAppAdmin);
    const senderLevel = getRankLevel(senderRank);

    if (senderLevel < 4 && !message.key.fromMe) {
        await sock.sendMessage(chatId, { 
            text: '*↢ عذراً الامر يخص〖 مالك〗فقط.*' 
        }, { quoted: message });
        return;
    }

    // لا يمكن ترقية البوت نفسه
    const { isTargetBot, rejectBotTarget } = require('../lib/isBotTarget');
    if (isTargetBot(sock, groupMetadata, userToPromote[0])) {
        await rejectBotTarget(sock, chatId, message, { react: false });
        return;
    }

    try {
        if (!sock.recentManualActions) {
            sock.recentManualActions = new Map();
        }
        
        const actionKey = `${chatId}_${userToPromote.map(j => { const s = typeof j === 'string' ? j : (j && j.id ? j.id : String(j)); return s.split('@')[0].split(':')[0]; }).join('_')}`;
        sock.recentManualActions.set(actionKey, Date.now());
        setTimeout(() => sock.recentManualActions.delete(actionKey), 3000);
        
        // Only call setUserRank - don't promote in WhatsApp (to avoid double promotion)
        await setUserRank(chatId, userToPromote[0], 'ادمن');
        
        const usernames = await Promise.all(userToPromote.map(async jid => {
            const jidStr = typeof jid === 'string' ? jid : (jid && jid.id ? jid.id : String(jid));
            const contact = sock.contacts?.get?.(jidStr);
            const name = contact?.name || jidStr.split('@')[0];
            return `@${name}`;
        }));
        
        const mentionList = userToPromote.map(j => { const s = typeof j === 'string' ? j : (j && j.id ? j.id : String(j)); return s; });
        
        const promotionMessage = `*↢ تهنـى يـا 「 ${usernames.join(', ')} 」*\n*↢ رفعتـك ادمن*`;
        
        await sock.sendMessage(chatId, { 
            text: promotionMessage,
            mentions: mentionList
        }, { quoted: message });
    } catch (error) {
        console.error('Error in promote command:', error);
        await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE}, { quoted: message });
    }
}

async function handlePromotionEvent(sock, groupId, participants, author) {
    try {
        const norm = (a) => { const s = typeof a === "string" ? a : (a && (a.id || a.jid || a.phoneNumber) ? (a.id || a.jid || a.phoneNumber) : String(a)); return s.split('@')[0].split(':')[0]; };
        const botIdNum = sock.user?.id?.split(':')[0]?.split('@')[0] || '';
        const botPromoted = participants.some(p => {
            if (typeof p === 'string') return p.split('@')[0].split(':')[0] === botIdNum;
            const idNorm = (p.id || p.jid || '').split('@')[0].split(':')[0];
            const phoneNorm = (p.phoneNumber || '').split('@')[0].split(':')[0];
            return idNorm === botIdNum || phoneNorm === botIdNum;
        });
        if (botPromoted) return; // البوت ترقى — يتجاهل

        const participantsStr = participants.map(norm);

        const actionKey = `${groupId}_${participantsStr.join('_')}`;
        if (sock.recentManualActions && sock.recentManualActions.has(actionKey)) {
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        const groupMeta = await sock.groupMetadata(groupId).catch(() => null);
        const promotedUsernames = await Promise.all(participants.map(async jid => {
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

        const promotionMessage = `*↢ تهنـى يـا 「 ${promotedUsernames.join(', ')} 」*\n*↢ رفعتـك مالك*`;
        
        await sock.sendMessage(groupId, {
            text: promotionMessage,
            mentions: mentionList
        });
    } catch (error) {
        console.error('Error handling promotion event:', error);
    }
}

module.exports = { promoteCommand, handlePromotionEvent };
