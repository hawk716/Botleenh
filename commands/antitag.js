const { UNDER_MAINTENANCE } = require('../lib/messages');
const { setAntitag, getAntitag, removeAntitag } = require('../lib/index');
const { getUserRank, getRankLevel } = require('../lib/ranks');
const { addRestriction } = require('../lib/restrictions');
const { addTagViolation, resetTagViolations } = require('../lib/antilink');

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

async function handleAntitagCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const senderParticipant = groupMetadata.participants.find(p => p.id === senderId);
        const isWhatsAppAdmin = senderParticipant && senderParticipant.admin;
        const senderRank = await getUserRank(chatId, senderId, isWhatsAppAdmin);
        const senderLevel = getRankLevel(senderRank);

        // مدير or higher (level >= 3) can use this
        if (senderLevel < 3 && !message.key.fromMe) {
            await sock.sendMessage(chatId, { text: '*↢ هـذا الامـر يخـص〖 مدير 〗*' },{quoted :message});
            return;
        }

        const username = `@${senderId.split('@')[0]}`;

        if (userMessage === 'قفل التاك') {
            await setAntitag(chatId, 'on', 'delete');
            await sock.sendMessage(chatId, { 
                text: `*↢ ال${senderRank} 「 ${username} 」*\n*↢ تم قفل التـاك*`,
                mentions: [senderId]
            }, { quoted: message });
            return;
        }

        if (userMessage === 'فتح التاك') {
            await removeAntitag(chatId, 'on');
            await sock.sendMessage(chatId, { 
                text: `*↢ ال${senderRank} 「 ${username} 」*\n*↢ تم فتح التـاك*`,
                mentions: [senderId]
            }, { quoted: message });
            return;
        }

        if (userMessage.startsWith('إعدادات التاك')) {
            const parts = userMessage.split(' ');
            if (parts.length < 3) {
                await sock.sendMessage(chatId, { 
                    text: `*_يرجى تحديد إجراء: إعدادات التاك delete | kick_*` 
                }, { quoted: message });
                return;
            }
            const setAction = parts[2];
            if (!['delete', 'kick'].includes(setAction)) {
                await sock.sendMessage(chatId, { 
                    text: '*_إجراء غير صالح. اختر delete أو kick._*' 
                },{quoted :message});
                return;
            }
            await setAntitag(chatId, 'on', setAction);
            await sock.sendMessage(chatId, { 
                text: `*_تم تعيين إجراء مكافحة المنشن إلى ${setAction}_*`
            },{quoted :message});
            return;
        }

    } catch (error) {
        console.error('Error in antitag command:', error);
        await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE },{quoted :message});
    }
}

// تطبيع JID: Baileys قد يعطي @lid بدل @s.whatsapp.net لنفس الشخص
function sameUser(a, b) {
    if (!a || !b) return false
    return a.split('@')[0].split(':')[0] === b.split('@')[0].split(':')[0]
}

async function handleTagDetection(sock, chatId, message, senderId) {
    try {
        // رسائل البوت نفسه لا تُفحص إطلاقاً.
        // بدون هذا: البوت يرد بمنشن ← ح understatement坛 يحذف ردّه ← يرد مجدداً = حلقة ذاتية.
        if (message.key.fromMe) return false;

        const antitagSetting = await getAntitag(chatId, 'on');
        if (!antitagSetting || !antitagSetting.enabled) return false;

        const msg = message.message || {};
        const contextInfo = msg.extendedTextMessage?.contextInfo ||
                           msg.imageMessage?.contextInfo ||
                           msg.videoMessage?.contextInfo ||
                           msg.documentMessage?.contextInfo ||
                           null;

        const mentionedJids = contextInfo?.mentionedJid || [];
        const groupMentions = contextInfo?.groupMentions || [];
        const messageText = msg.conversation ||
                           msg.extendedTextMessage?.text ||
                           '';
        const hasTextMention = /@\S+/.test(messageText);
        if (mentionedJids.length === 0 && groupMentions.length === 0 && !hasTextMention) return false;

        let isGroupAdmin = false;
        try {
            const groupMetadata = await sock.groupMetadata(chatId);
            const participant = groupMetadata.participants.find(p => sameUser(p.id, senderId));
            isGroupAdmin = participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
        } catch (e) {}

        // البوت نفسه لا يُعاقب على منشناته (يرسل منشنات في واجهاته).
        const botJid = sock.user?.id?.split(':')[0];
        if (botJid && sameUser(senderId, botJid)) return false;

        const userRank = await getUserRank(chatId, senderId, isGroupAdmin);
        const userLevel = getRankLevel(userRank);
        if (userLevel >= 2) return false;

        await sock.sendMessage(chatId, {
            delete: {
                remoteJid: chatId,
                fromMe: false,
                id: message.key.id,
                participant: senderId
            }
        });

        await sock.sendMessage(chatId, {
            text: `*↢ المستخدم〖 @${senderId.split('@')[0]} 〗*\n*↢ عـذراً ممنوع التاك.*`,
            mentions: [senderId]
        });

        const count = addTagViolation(chatId, senderId);
        if (count >= 10) {
            const expiresAt = Date.now() + 3 * 24 * 60 * 60 * 1000;
            await addRestriction(chatId, senderId, expiresAt);
            resetTagViolations(chatId, senderId);
            const expireDate = formatDate(new Date(expiresAt));
            await sock.sendMessage(chatId, {
                text: `*↢ المستخدم〖 @${senderId.split('@')[0]} 〗*\n*↢ بسبب تكرارك لارسال التاك تم تقييدك حتى「${expireDate}」*`,
                mentions: [senderId]
            });
        }

        return true;
    } catch (error) {
        console.error('Error in tag detection:', error);
        return false;
    }
}

module.exports = {
    handleAntitagCommand,
    handleTagDetection
};
