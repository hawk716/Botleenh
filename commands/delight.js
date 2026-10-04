const { UNDER_MAINTENANCE } = require('../lib/messages');
module.exports = async function(sock, chatId, message, args = '') {
    const text = (args || '').trim();
    if (!text) {
        await sock.sendMessage(chatId, { text: '*↢ ارسل دلع + الاسم*\n*↢ مثـال: دلع لين*' }, { quoted: message });
        return;
    }

    try {
        const { getNicknames } = require('../lib/nicknames');
        const names = await getNicknames(text);
        const out = names.map((n, i) => `${i + 1}. ${n}`).join('\n');
        await sock.sendMessage(chatId, { text: out || 'لا توجد نتائج.' }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: UNDER_MAINTENANCE }, { quoted: message });
    }
};