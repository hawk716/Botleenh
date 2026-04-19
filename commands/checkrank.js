
const { getUserRank } = require('../lib/ranks');

async function checkRankCommand(sock, chatId, message) {
    try {
        let userToCheck;

        const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        if (mentionedJid && mentionedJid.length > 0) {
            userToCheck = mentionedJid[0];
        }
        else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToCheck = message.message.extendedTextMessage.contextInfo.participant;
        } else {
            return;
        }

        const rank = await getUserRank(chatId, userToCheck);

        const rankMessage = `*↫ الرتبه : ${rank}*`;

        await sock.sendMessage(chatId, {
            text: rankMessage,
            mentions: [userToCheck]
        }, { quoted: message });
    } catch (error) {
        console.error('Error in checkRankCommand:', error);
        await sock.sendMessage(chatId, { text: '❌ حدث خطأ في كشف الرتبه!' });
    }
}

module.exports = checkRankCommand;
