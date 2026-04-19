
const isAdmin = require('../lib/isAdmin');
const { getUserRank, removeUserRank, getRankLevel } = require('../lib/ranks');

async function demoteCommand(sock, chatId, mentionedJids, message, specifiedRank = null) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { 
                text: 'هذا الأمر يمكن استخدامه في المجموعات فقط!'
            });
            return;
        }

        try {
            const adminStatus = await isAdmin(sock, chatId, message.key.participant || message.key.remoteJid);
            
            if (!adminStatus.isBotAdmin) {
                await sock.sendMessage(chatId, { 
                    text: '❌ خطأ: يرجى جعل البوت مشرف أولاً لاستخدام هذا الأمر.'
                });
                return;
            }

            if (!adminStatus.isSenderAdmin) {
                await sock.sendMessage(chatId, { 
                    text: '❌ خطأ: فقط مشرفي المجموعة يمكنهم استخدام أمر التخفيض.'
                });
                return;
            }
        } catch (adminError) {
            console.error('Error checking admin status:', adminError);
            await sock.sendMessage(chatId, { 
                text: '❌ خطأ: يرجى التأكد من أن البوت مشرف في هذه المجموعة.'
            });
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
                text: '❌ خطأ: يرجى عمل منشن للمستخدم أو الرد على رسالته لتخفيضه!'
            });
            return;
        }

        if (!sock.recentManualActions) {
            sock.recentManualActions = new Map();
        }
        
        const actionKey = `${chatId}_${userToDemote.join('_')}`;
        sock.recentManualActions.set(actionKey, Date.now());
        setTimeout(() => sock.recentManualActions.delete(actionKey), 3000);
        
        const usernames = userToDemote.map(jid => `@${jid.split('@')[0]}`);
        const groupMetadata = await sock.groupMetadata(chatId);
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
                });
                return;
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        await sock.groupParticipantsUpdate(chatId, userToDemote, "demote");
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await removeUserRank(chatId, userToDemote[0]);
        
        const demotionMessage = `*↢ الطيـب「 ${usernames.join(', ')} 」*\n*↢ تم تنزيله من ${currentRank}*`;
        
        await sock.sendMessage(chatId, { 
            text: demotionMessage,
            mentions: userToDemote
        });
    } catch (error) {
        console.error('Error in demote command:', error);
        if (error.data === 429) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            try {
                await sock.sendMessage(chatId, { 
                    text: '❌ تم الوصول للحد الأقصى. يرجى المحاولة مرة أخرى بعد بضع ثوانٍ.'
                });
            } catch (retryError) {
                console.error('Error sending retry message:', retryError);
            }
        } else {
            try {
                await sock.sendMessage(chatId, { 
                    text: '❌ فشل عملية التخفيض. تأكد من أن البوت مشرف وله الصلاحيات الكافية.'
                });
            } catch (sendError) {
                console.error('Error sending error message:', sendError);
            }
        }
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
