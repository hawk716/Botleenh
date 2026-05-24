const { handleWelcome, sendWelcome } = require('../lib/welcome');
const { isWelcomeOn } = require('../lib/index');
const { setJoinDate } = require('../lib/members');
const { getUserRank } = require('../lib/ranks');

async function welcomeCommand(sock, chatId, message, match) {
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { text: 'هذا الأمر يمكن استخدامه في المجموعات فقط.' });
        return;
    }
    const text = message.message?.conversation ||
                message.message?.extendedTextMessage?.text || '';
    const matchText = text.split(' ').slice(1).join(' ');
    await handleWelcome(sock, chatId, message, matchText);
}

async function handleJoinEvent(sock, id, participants) {
    for (const p of participants) {
        const participant = typeof p === 'object' ? (p.id || p.jid || String(p)) : p;
        setJoinDate(id, participant);
        await sendWelcome(sock, id, participant);
    }
}

module.exports = { welcomeCommand, handleJoinEvent };
