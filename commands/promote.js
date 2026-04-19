
const { isAdmin } = require('../lib/isAdmin');
const { setUserRank } = require('../lib/ranks');

async function promoteCommand(sock, chatId, mentionedJids, message) {
    let userToPromote = [];
    
    if (mentionedJids && mentionedJids.length > 0) {
        userToPromote = mentionedJids;
    }
    else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToPromote = [message.message.extendedTextMessage.contextInfo.participant];
    }
    
    if (userToPromote.length === 0) {
        await sock.sendMessage(chatId, { 
            text: 'يرجى عمل منشن للمستخدم أو الرد على رسالته لترقيته!'
        });
        return;
    }

    try {
        if (!sock.recentManualActions) {
            sock.recentManualActions = new Map();
        }
        
        const actionKey = `${chatId}_${userToPromote.join('_')}`;
        sock.recentManualActions.set(actionKey, Date.now());
        setTimeout(() => sock.recentManualActions.delete(actionKey), 3000);
        
        await sock.groupParticipantsUpdate(chatId, userToPromote, "promote");
        
        await setUserRank(chatId, userToPromote[0], 'مالك');
        
        const usernames = userToPromote.map(jid => `@${jid.split('@')[0]}`);
        
        const promotionMessage = `*↢ تهنـى يـا 「 ${usernames.join(', ')} 」*\n*↢ رفعتـك مالك*`;
        
        await sock.sendMessage(chatId, { 
            text: promotionMessage,
            mentions: userToPromote
        });
    } catch (error) {
        console.error('Error in promote command:', error);
        await sock.sendMessage(chatId, { text: 'فشل عملية الترقية!'});
    }
}

async function handlePromotionEvent(sock, groupId, participants, author) {
    try {
        const actionKey = `${groupId}_${participants.join('_')}`;
        if (sock.recentManualActions && sock.recentManualActions.has(actionKey)) {
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        const promotedUsernames = await Promise.all(participants.map(async jid => {
            return `@${jid.split('@')[0]}`;
        }));

        let mentionList = [...participants];

        if (author && author.length > 0) {
            const authorJid = author;
            mentionList.push(authorJid);
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        const promotionMessage = `*↢ تهنـى يـا 「 ${promotedUsernames.join(', ')} 」*\n*↢ رفعتـك مالك*`;
        
        await sock.sendMessage(groupId, {
            text: promotionMessage,
            mentions: participants
        });
    } catch (error) {
        console.error('Error handling promotion event:', error);
    }
}

module.exports = { promoteCommand, handlePromotionEvent };
