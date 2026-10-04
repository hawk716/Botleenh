const { UNDER_MAINTENANCE } = require('../lib/messages');
const isAdmin = require('../lib/isAdmin');
const { getUserRank, getRankLevel } = require('../lib/ranks');

async function kickCommand(sock, chatId, senderId, mentionedJids, message) {
    let usersToKick = [];

    if (mentionedJids && mentionedJids.length > 0) {
        usersToKick = mentionedJids;
    } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        usersToKick = [message.message.extendedTextMessage.contextInfo.participant];
    }

    if (usersToKick.length === 0) {
        await sock.sendMessage(chatId, {
            text: '*↢ يرجى عمل منشن للمستخدم أو الرد على رسالته لطرده!*'
        }, { quoted: message });
        return;
    }

    const norm = (a) => { const s = typeof a === 'string' ? a : (a && (a.id || a.jid || a.phoneNumber) ? (a.id || a.jid || a.phoneNumber) : String(a)); return s.split('@')[0].split(':')[0]; };

    const botIdNum = norm(sock.user?.id);
    const botLid = sock.user?.lid ? norm(sock.user.lid) : '';

    const groupMetadata = await sock.groupMetadata(chatId).catch(() => null);

    const botInGroup = groupMetadata?.participants?.find(p => {
        const pid = norm(p.id);
        return pid === botIdNum || (botLid && pid === botLid);
    });

    const isBotTarget = botInGroup ? usersToKick.some(u => norm(u) === norm(botInGroup.id)) : usersToKick.some(u => {
        const n = norm(u);
        return n === botIdNum || (botLid && n === botLid);
    });

    if (isBotTarget) {
        await sock.sendMessage(chatId, { react: { text: '🤡', key: message.key } }).catch(() => {});
        await sock.sendMessage(chatId, {
            text: "*↢ عذراً لاتسـتطـيـع اسـتخدام الامـر على البوت.*"
        }, { quoted: message });
        return;
    }

    // Check if user is owner
    const isOwner = message.key.fromMe;
    if (!isOwner) {
        const { isBotAdmin } = await isAdmin(sock, chatId, senderId);
        const senderParticipant = groupMetadata?.participants?.find(p => p.id === senderId);
        const isWhatsAppAdmin = senderParticipant && senderParticipant.admin;
        const senderRank = await getUserRank(chatId, senderId, isWhatsAppAdmin);
        const senderLevel = getRankLevel(senderRank);

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { text: '*↢ يرجى جعل البوت مشرف أولاً.*' }, { quoted: message });
            return;
        }

        // مدير or higher (level >= 3)
        if (!message.key.fromMe && senderLevel < 3) {
            await sock.sendMessage(chatId, { text: '*↢ هـذا الامـر يخـص〖 المدير 〗*' }, { quoted: message });
            return;
        }

        // مالك (level 4) cannot kick another مالك
        if (senderLevel === 4) {
            const targetRank = await getUserRank(chatId, usersToKick[0]);
            if (targetRank === 'مالك') {
                await sock.sendMessage(chatId, {
                    text: '*↢ عـذراً الامـر يـخص  ↤︎〖  المـالك الاسـاسـي 〗فـقط .*'
                }, { quoted: message });
                return;
            }
        }
    }

    try {
        const usernames = usersToKick.map(jid => {
            const participant = groupMetadata?.participants?.find(p => p.id === jid);
            const name = participant?.name || sock.contacts?.get?.(jid)?.name || jid.split('@')[0];
            return `@${name}`;
        });

        // Perform the kick
        await sock.groupParticipantsUpdate(chatId, usersToKick, "remove");

        // Send single confirmation message
        await sock.sendMessage(chatId, {
            text: `*↢ لعيونك ما يظل ولا ثانية*\n*↢ المستخدم ↢* ${usernames.join(', ')}`,            mentions: usersToKick
        }, { quoted: message });
    } catch (error) {
        console.error('Error in kick command:', error);
        await sock.sendMessage(chatId, {
            text: UNDER_MAINTENANCE
        }, { quoted: message });
    }
}

module.exports = kickCommand;